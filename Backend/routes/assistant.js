import express from 'express';
import { getDbConnection } from '../database/db.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', optionalAuth, async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ message: 'A message string is required' });
  }

  const queryText = message.toLowerCase();
  const isEmployee = req.user && (req.user.role === 'employee' || req.user.role === 'admin');

  try {
    const db = await getDbConnection();
    
    // Fetch tools and events to perform filtering
    let toolsQuery = '';
    if (isEmployee) {
      toolsQuery = 'SELECT id, name, description, field, role, use_case, difficulty, access_type FROM tools';
    } else {
      toolsQuery = "SELECT id, name, description, field, role, use_case, difficulty, access_type FROM tools WHERE access_type != 'Internal-only'";
    }
    
    const tools = await db.all(toolsQuery);
    const events = await db.all('SELECT * FROM events ORDER BY date ASC');
    await db.close();

    let reply = '';
    let matchedTools = [];
    let matchedEvents = [];

    // 1. Check for specific tool names
    for (const tool of tools) {
      if (queryText.includes(tool.name.toLowerCase())) {
        matchedTools.push(tool);
      }
    }

    // 2. Check for events/workshops queries
    const eventKeywords = ['event', 'workshop', 'meetup', 'hackathon', 'schedule', 'training', 'classes'];
    const seeksEvents = eventKeywords.some(keyword => queryText.includes(keyword));

    if (seeksEvents) {
      const currentDate = new Date().toISOString();
      matchedEvents = events.filter(e => e.date >= currentDate);
    }

    // 3. Match categories / fields
    const categories = {
      marketing: ['marketing', 'content', 'copywriting', 'copy', 'social media', 'jasper', 'copy.ai', 'ad ', 'advertis'],
      development: ['developer', 'coding', 'code', 'software', 'programming', 'copilot', 'cursor', 'phind', 'engineer'],
      design: ['design', 'creative', 'image', 'picture', 'photo', 'graphic', 'midjourney', 'canva', 'magic studio'],
      automation: ['automat', 'zapier', 'make', 'scenario', 'workflow', 'ops assistant'],
      support: ['support', 'customer service', 'ticket', 'help desk', 'fin', 'intercom'],
      document: ['document', 'pdf', 'contract', 'nda', 'analyzer', 'legal', 'finance']
    };

    let matchedFields = [];
    for (const [key, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => queryText.includes(kw))) {
        matchedFields.push(key);
      }
    }

    // Filter tools based on category matches if no specific tools were matched by name
    if (matchedTools.length === 0) {
      tools.forEach(tool => {
        const field = tool.field.toLowerCase();
        const useCase = tool.use_case.toLowerCase();
        const desc = tool.description.toLowerCase();

        let isMatch = false;
        
        if (matchedFields.includes('marketing') && (field.includes('marketing') || useCase.includes('content'))) isMatch = true;
        if (matchedFields.includes('development') && (field.includes('development') || useCase.includes('code'))) isMatch = true;
        if (matchedFields.includes('design') && (field.includes('design') || useCase.includes('content') || desc.includes('image'))) isMatch = true;
        if (matchedFields.includes('automation') && (field.includes('automation') || field.includes('operations') || useCase.includes('automation'))) isMatch = true;
        if (matchedFields.includes('support') && (field.includes('support') || desc.includes('customer'))) isMatch = true;
        if (matchedFields.includes('document') && (desc.includes('document') || desc.includes('contract') || field.includes('productivity') || useCase.includes('analysis'))) isMatch = true;

        // Filter by role keywords
        if (queryText.includes('founder') && tool.role.toLowerCase().includes('founder')) isMatch = true;
        if (queryText.includes('marketer') && tool.role.toLowerCase().includes('marketer')) isMatch = true;
        if (queryText.includes('developer') && tool.role.toLowerCase().includes('developer')) isMatch = true;
        if (queryText.includes('designer') && tool.role.toLowerCase().includes('designer')) isMatch = true;
        if (queryText.includes('manager') && tool.role.toLowerCase().includes('manager')) isMatch = true;

        if (isMatch) {
          matchedTools.push(tool);
        }
      });
    }

    // 4. Filter by difficulty if queried (e.g. beginner, intermediate, advanced)
    const difficulties = ['beginner', 'intermediate', 'advanced'];
    const requestedDifficulty = difficulties.find(d => queryText.includes(d));
    if (requestedDifficulty && matchedTools.length > 0) {
      matchedTools = matchedTools.filter(t => t.difficulty.toLowerCase() === requestedDifficulty);
    }

    // 5. Compile reply
    if (matchedTools.length > 0 || matchedEvents.length > 0) {
      if (matchedTools.length > 0) {
        reply += `I found the following relevant AI tools in our directory:\n\n`;
        matchedTools.slice(0, 5).forEach(t => {
          reply += `- **${t.name}** (${t.field} | ${t.difficulty} | ${t.access_type})\n  ${t.description}\n`;
        });
        if (matchedTools.length > 5) {
          reply += `\nThere are more tools matching your query in the directory. You can use the search bar filters to see the complete list.\n`;
        }
      }

      if (matchedEvents.length > 0) {
        if (reply) reply += `\n`;
        reply += `Here are the upcoming Innovation City events:\n\n`;
        matchedEvents.slice(0, 3).forEach(e => {
          const dateStr = new Date(e.date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          reply += `- **${e.title}** (${e.type})\n  Date: ${dateStr}\n  Location: ${e.location}\n  ${e.description}\n`;
        });
      }
    } else {
      reply = `I am here to help you navigate the AI Innovation Hub. I can suggest tools based on your role, field, or target difficulty, or tell you about upcoming workshops.

Please try asking questions like:
- "Which tools can help with marketing?"
- "Recommend beginner-friendly developer tools."
- "What events are coming up?"
- "How do I automate my daily operations?"`;
    }

    return res.json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Database error inside assistant query engine' });
  }
});

export default router;
