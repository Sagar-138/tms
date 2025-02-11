const Task = require('../models/Task');
const User = require('../models/User');
const HierarchyLevel = require('../models/HierarchyLevel');
const Notification = require('../models/Notification');
const { io } = require('../socket');
const { createNotification } = require('./notification.controller');
const { canAssignTaskTo } = require('../utils/hierarchyHelper');

exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      assignedTo,
      dueDate,
      priority,
      category,
      estimatedHours,
      subtasks,
      reviewers
    } = req.body;

    // Get the assigner's and assignee's hierarchy levels
    const assigner = await User.findById(req.user.id).populate('hierarchyLevel');
    const assignee = await User.findById(assignedTo).populate('hierarchyLevel');

    if (!assigner.hierarchyLevel || !assignee.hierarchyLevel) {
      return res.status(400).json({ 
        message: 'Both assigner and assignee must have hierarchy levels assigned' 
      });
    }

    // Check if assigner can assign to assignee
    const canAssign = await canAssignTaskTo(
      assigner.hierarchyLevel._id,
      assignee.hierarchyLevel._id
    );

    if (!canAssign) {
      return res.status(403).json({ 
        message: 'You cannot assign tasks to employees at the same or higher level' 
      });
    }

    // Check daily task limit for assignee
    const todayTasks = await Task.countDocuments({
      assignedTo,
      createdAt: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999)
      }
    });

    if (todayTasks >= assignee.hierarchyLevel.maxTasksPerDay) {
      return res.status(400).json({ 
        message: 'Daily task limit exceeded for this user' 
      });
    }

    const task = await Task.create({
      title,
      description,
      company: req.user.company,
      assignedBy: req.user.id,
      assignedTo,
      dueDate,
      priority,
      category,
      estimatedHours,
      subtasks: subtasks || [],
      reviewers: reviewers || [],
      history: [{
        action: 'TASK_CREATED',
        performedBy: req.user.id,
        newStatus: 'pending'
      }]
    });

    // Create notification for assigned user
    await createNotification({
      user: task.assignedTo,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${task.title}`,
      task: task._id,
      from: req.user.id,
      priority
    });

    // Emit socket event
    io.to(`user-${assignedTo}`).emit('notification', task);

    // Notify reviewers if any
    if (reviewers && reviewers.length > 0) {
      for (const reviewer of reviewers) {
        const reviewerNotification = await Notification.create({
          type: 'REVIEW_REQUESTED',
          user: reviewer.user,
          task: task._id,
          message: `You have been assigned as a reviewer for task: ${title}`
        });
        io.to(`user-${reviewer.user}`).emit('notification', reviewerNotification);
      }
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = status;
    task.history.push({
      action: 'STATUS_UPDATED',
      performedBy: req.user.id,
      newStatus: status,
      timestamp: new Date()
    });

    await task.save();

    // Create notification for task assignee
    await createNotification({
      user: task.assignedTo,
      type: 'TASK_UPDATED',
      title: 'Task Status Updated',
      message: `Task status updated to ${status}: ${task.title}`,
      task: task._id,
      from: req.user.id,
      priority: task.priority
    });

    res.json(task);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to check hierarchy access
const canAccessTask = async (userId, taskId) => {
  const user = await User.findById(userId).populate('hierarchyLevel');
  const task = await Task.findById(taskId).populate({
    path: 'assignedTo',
    populate: { path: 'hierarchyLevel' }
  });

  if (!user || !task) return false;

  // Company admins can access all tasks
  if (user.role === 'company_admin') return true;

  // Users can access their own tasks
  if (task.assignedTo._id.toString() === userId) return true;

  // Users can access tasks of those below them in hierarchy
  return user.hierarchyLevel.level < task.assignedTo.hierarchyLevel.level;
};

exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const {
      content,
      status,
      priority,
      dueDate
    } = req.body;

    // Check access permission
    const hasAccess = await canAccessTask(req.user.id, taskId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You do not have permission to access this task' });
    }

    const task = await Task.findById(taskId);
    
    // Create update record
    const update = {
      content,
      updatedBy: req.user.id,
      attachments: req.files ? req.files.map(file => ({
        filename: file.originalname,
        path: file.path,
        type: 'update',
        uploadedBy: req.user.id
      })) : []
    };

    task.updates.push(update);

    // Update task fields if provided
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;

    await task.save();

    // Create notification for status changes
    await createNotification({
      user: task.assignedTo,
      type: 'TASK_UPDATED',
      message: `Task status updated to ${status}: ${task.title}`,
      task: task._id
    });

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.submitTaskReport = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { content } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only assigned user can submit report' });
    }

    const report = {
      content,
      reportedBy: req.user.id,
      attachments: req.files ? req.files.map(file => ({
        filename: file.originalname,
        path: file.path,
        type: 'report',
        uploadedBy: req.user.id
      })) : []
    };

    task.reports.push(report);
    task.status = 'under_review';
    await task.save();

    // Notify task creator
    await createNotification({
      user: task.assignedBy,
      type: 'TASK_REPORT_SUBMITTED',
      message: `New report submitted for task "${task.title}"`,
      task: task._id
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTasksByHierarchy = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('hierarchyLevel');
    
    let query = { company: req.user.company };
    
    // If not company admin, only show tasks based on hierarchy
    if (req.user.role !== 'company_admin') {
      const subordinates = await User.find({
        company: req.user.company,
        'hierarchyLevel.level': { $gt: user.hierarchyLevel.level }
      }).select('_id');

      query.$or = [
        { assignedTo: req.user.id },
        { assignedTo: { $in: subordinates.map(s => s._id) } }
      ];
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email hierarchyLevel')
      .populate('assignedBy', 'name email')
      .sort('-createdAt');

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ company: req.user.company })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.comments.push({
      user: req.user._id,
      content: req.body.content
    });

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTaskAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { company: req.user.company };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get task statistics
    const totalTasks = await Task.countDocuments(query);
    const completedTasks = await Task.countDocuments({ ...query, status: 'completed' });
    const pendingTasks = await Task.countDocuments({ ...query, status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ ...query, status: 'in_progress' });

    // Get tasks by priority
    const tasksByPriority = await Task.aggregate([
      { $match: query },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Get tasks by category
    const tasksByCategory = await Task.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Get average completion time
    const completedTasksData = await Task.find({
      ...query,
      status: 'completed'
    }).select('createdAt updatedAt');

    const avgCompletionTime = completedTasksData.reduce((acc, task) => {
      return acc + (task.updatedAt - task.createdAt);
    }, 0) / (completedTasksData.length || 1);

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      tasksByPriority,
      tasksByCategory,
      avgCompletionTime: Math.round(avgCompletionTime / (1000 * 60 * 60 * 24)), // Convert to days
      completionRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTasksByDepartment = async (req, res) => {
  try {
    const { dept } = req.params;
    
    // Get all users in the department
    const departmentUsers = await User.find({
      company: req.user.company,
      'hierarchyLevel.departmentScope': dept
    }).select('_id');

    const tasks = await Task.find({
      company: req.user.company,
      assignedTo: { $in: departmentUsers.map(user => user._id) }
    })
    .populate('assignedTo', 'name email hierarchyLevel')
    .populate('assignedBy', 'name email')
    .sort('-createdAt');

    res.json(tasks);
  } catch (error) {
    console.error('Error getting department tasks:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTaskTimeline = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { company: req.user.company };

    if (startDate && endDate) {
      query.dueDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const tasks = await Task.find(query)
      .select('title status dueDate priority')
      .sort('dueDate');

    // Group tasks by date
    const timeline = tasks.reduce((acc, task) => {
      const date = task.dueDate.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
      return acc;
    }, {});

    res.json(timeline);
  } catch (error) {
    console.error('Error getting task timeline:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCompanyStats = async (req, res) => {
  try {
    const companyId = req.user.company;

    if (!companyId) {
      return res.status(400).json({ message: 'Company ID not found' });
    }

    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      highPriorityTasks,
      mediumPriorityTasks,
      lowPriorityTasks,
      recentTasks
    ] = await Promise.all([
      Task.countDocuments({ company: companyId }),
      Task.countDocuments({ company: companyId, status: 'completed' }),
      Task.countDocuments({ company: companyId, status: 'pending' }),
      Task.countDocuments({ company: companyId, status: 'in_progress' }),
      Task.countDocuments({ company: companyId, priority: 'high' }),
      Task.countDocuments({ company: companyId, priority: 'medium' }),
      Task.countDocuments({ company: companyId, priority: 'low' }),
      Task.find({ company: companyId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('assignedTo', 'name')
    ]);

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      tasksByPriority: {
        high: highPriorityTasks,
        medium: mediumPriorityTasks,
        low: lowPriorityTasks
      },
      completionRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0,
      recentTasks
    });
  } catch (error) {
    console.error('Error getting company task stats:', error);
    res.status(500).json({ 
      message: 'Error getting task statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

