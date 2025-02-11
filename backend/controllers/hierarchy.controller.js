const HierarchyLevel = require('../models/HierarchyLevel');
const User = require('../models/User');

exports.createHierarchyLevel = async (req, res) => {
  try {
    const { name, level, canAssignTasks, reportsTo } = req.body;

    // Verify if the user is a company admin
    if (req.user.role !== 'company_admin') {
      return res.status(403).json({ message: 'Only company admins can create hierarchy levels' });
    }

    const hierarchyLevel = await HierarchyLevel.create({
      company: req.user.company,
      name,
      level,
      canAssignTasks,
      reportsTo
    });

    res.status(201).json(hierarchyLevel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCompanyHierarchy = async (req, res) => {
  try {
    const hierarchy = await HierarchyLevel.find({ company: req.user.company })
      .populate('reportsTo', 'name level');
    
    res.json(hierarchy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateHierarchyLevel = async (req, res) => {
  try {
    const { name, canAssignTasks, reportsTo } = req.body;
    const hierarchyLevel = await HierarchyLevel.findById(req.params.id);

    if (!hierarchyLevel) {
      return res.status(404).json({ message: 'Hierarchy level not found' });
    }

    if (hierarchyLevel.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this hierarchy' });
    }

    hierarchyLevel.name = name || hierarchyLevel.name;
    hierarchyLevel.canAssignTasks = canAssignTasks ?? hierarchyLevel.canAssignTasks;
    hierarchyLevel.reportsTo = reportsTo || hierarchyLevel.reportsTo;

    await hierarchyLevel.save();
    res.json(hierarchyLevel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};