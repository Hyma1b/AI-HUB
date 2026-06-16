import express from 'express';
import { getDbConnection } from '../database/db.js';
import { optionalAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Retrieve all tools (conditional based on authentication)
router.get('/', optionalAuth, async (req, res) => {
  const isEmployee = req.user && (req.user.role === 'employee' || req.user.role === 'admin');

  try {
    const db = await getDbConnection();
    let query = '';
    let params = [];

    if (isEmployee) {
      // Employees see everything: public tools, internal-only tools, and internal info
      query = `
        SELECT t.*, 
               i.owner, i.access_method, i.cost, i.approval_status, 
               i.internal_department, i.support_contact, i.internal_notes
        FROM tools t
        LEFT JOIN internal_tool_info i ON t.id = i.tool_id
      `;
    } else {
      // Public visitors see only non-internal-only tools
      query = `
        SELECT * FROM tools 
        WHERE access_type != 'Internal-only'
      `;
    }

    const tools = await db.all(query, params);
    await db.close();

    // Map tools to clean structures
    const result = tools.map(t => {
      const tool = {
        id: t.id,
        name: t.name,
        description: t.description,
        field: t.field,
        role: t.role,
        use_case: t.use_case,
        tool_type: t.tool_type,
        difficulty: t.difficulty,
        access_type: t.access_type,
        external_url: t.external_url,
        business_cta: t.business_cta,
        guides: {
          beginner: { guide: t.beginner_guide, prompt: t.beginner_prompt },
          intermediate: { guide: t.intermediate_guide, prompt: t.intermediate_prompt },
          advanced: { guide: t.advanced_guide, prompt: t.advanced_prompt }
        }
      };

      if (isEmployee) {
        tool.internal_info = t.owner ? {
          owner: t.owner,
          access_method: t.access_method,
          cost: t.cost,
          approval_status: t.approval_status,
          internal_department: t.internal_department,
          support_contact: t.support_contact,
          internal_notes: t.internal_notes
        } : null;
      }

      return tool;
    });

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Database error while fetching tools' });
  }
});

// Retrieve a single tool
router.get('/:id', optionalAuth, async (req, res) => {
  const { id } = req.params;
  const isEmployee = req.user && (req.user.role === 'employee' || req.user.role === 'admin');

  try {
    const db = await getDbConnection();
    let query = '';
    
    if (isEmployee) {
      query = `
        SELECT t.*, 
               i.owner, i.access_method, i.cost, i.approval_status, 
               i.internal_department, i.support_contact, i.internal_notes
        FROM tools t
        LEFT JOIN internal_tool_info i ON t.id = i.tool_id
        WHERE t.id = ?
      `;
    } else {
      query = `
        SELECT * FROM tools 
        WHERE id = ? AND access_type != 'Internal-only'
      `;
    }

    const t = await db.get(query, id);
    await db.close();

    if (!t) {
      return res.status(404).json({ message: 'Tool not found or access restricted' });
    }

    const tool = {
      id: t.id,
      name: t.name,
      description: t.description,
      field: t.field,
      role: t.role,
      use_case: t.use_case,
      tool_type: t.tool_type,
      difficulty: t.difficulty,
      access_type: t.access_type,
      external_url: t.external_url,
      business_cta: t.business_cta,
      guides: {
        beginner: { guide: t.beginner_guide, prompt: t.beginner_prompt },
        intermediate: { guide: t.intermediate_guide, prompt: t.intermediate_prompt },
        advanced: { guide: t.advanced_guide, prompt: t.advanced_prompt }
      }
    };

    if (isEmployee) {
      tool.internal_info = t.owner ? {
        owner: t.owner,
        access_method: t.access_method,
        cost: t.cost,
        approval_status: t.approval_status,
        internal_department: t.internal_department,
        support_contact: t.support_contact,
        internal_notes: t.internal_notes
      } : null;
    }

    return res.json(tool);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Database error while fetching tool details' });
  }
});

// Add a new tool (restricted to logged-in employees/admins)
router.post('/', requireRole(['employee', 'admin']), async (req, res) => {
  const {
    name, description, field, role, use_case, tool_type, difficulty, access_type, external_url, business_cta,
    beginner_guide, beginner_prompt, intermediate_guide, intermediate_prompt, advanced_guide, advanced_prompt,
    // optional internal details
    owner, access_method, cost, approval_status, internal_department, support_contact, internal_notes
  } = req.body;

  if (!name || !description || !field || !role || !use_case || !tool_type || !difficulty || !access_type || !external_url ||
      !beginner_guide || !beginner_prompt || !intermediate_guide || !intermediate_prompt || !advanced_guide || !advanced_prompt) {
    return res.status(400).json({ message: 'All public tool fields are required' });
  }

  try {
    const db = await getDbConnection();
    
    // Start transaction
    await db.run('BEGIN TRANSACTION');

    const check = await db.get('SELECT id FROM tools WHERE name = ?', name);
    if (check) {
      await db.run('ROLLBACK');
      await db.close();
      return res.status(400).json({ message: 'A tool with this name already exists' });
    }

    const result = await db.run(`
      INSERT INTO tools (
        name, description, field, role, use_case, tool_type, difficulty, access_type, external_url, business_cta,
        beginner_guide, beginner_prompt, intermediate_guide, intermediate_prompt, advanced_guide, advanced_prompt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      name, description, field, role, use_case, tool_type, difficulty, access_type, external_url, business_cta,
      beginner_guide, beginner_prompt, intermediate_guide, intermediate_prompt, advanced_guide, advanced_prompt
    );

    const toolId = result.lastID;

    // If it is internal-only or internal parameters were supplied, create internal_tool_info entry
    if (access_type === 'Internal-only' || owner || access_method || cost || approval_status || internal_department) {
      await db.run(`
        INSERT INTO internal_tool_info (
          tool_id, owner, access_method, cost, approval_status, internal_department, support_contact, internal_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        toolId, 
        owner || 'Unassigned', 
        access_method || 'Request Access', 
        cost || 'TBD', 
        approval_status || 'Evaluating', 
        internal_department || 'General', 
        support_contact || 'it-support@innovationcity.com', 
        internal_notes || ''
      );
    }

    await db.run('COMMIT');
    await db.close();

    return res.status(201).json({ message: 'Tool added successfully', toolId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Database error while inserting tool' });
  }
});

export default router;
