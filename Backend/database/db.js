import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'hub.db');

export async function getDbConnection() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

export async function initDb() {
  const db = await getDbConnection();

  // Enable foreign keys
  await db.get('PRAGMA foreign_keys = ON');

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT
    );

    CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      field TEXT NOT NULL,
      role TEXT NOT NULL,
      use_case TEXT NOT NULL,
      tool_type TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      access_type TEXT NOT NULL,
      external_url TEXT NOT NULL,
      business_cta TEXT,
      beginner_guide TEXT NOT NULL,
      beginner_prompt TEXT NOT NULL,
      intermediate_guide TEXT NOT NULL,
      intermediate_prompt TEXT NOT NULL,
      advanced_guide TEXT NOT NULL,
      advanced_prompt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS internal_tool_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_id INTEGER UNIQUE NOT NULL,
      owner TEXT NOT NULL,
      access_method TEXT NOT NULL,
      cost TEXT NOT NULL,
      approval_status TEXT NOT NULL,
      internal_department TEXT NOT NULL,
      support_contact TEXT NOT NULL,
      internal_notes TEXT,
      FOREIGN KEY(tool_id) REFERENCES tools(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      date_published TEXT NOT NULL,
      category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT NOT NULL,
      type TEXT NOT NULL,
      resources_link TEXT
    );
  `);

  // Check if users table is empty to seed initial data
  const userCheck = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCheck.count === 0) {
    console.log('Seeding database with initial data...');

    // Users
    const employeeHash = bcrypt.hashSync('Password123', 10);
    const adminHash = bcrypt.hashSync('AdminPassword123', 10);
    
    await db.run('INSERT INTO users (username, password_hash, role, department) VALUES (?, ?, ?, ?)', 
      'employee', employeeHash, 'employee', 'Operations');
    await db.run('INSERT INTO users (username, password_hash, role, department) VALUES (?, ?, ?, ?)', 
      'admin', adminHash, 'admin', 'Management');

    // 16 Tools & their guides
    const initialTools = [
      {
        name: 'ChatGPT',
        description: 'Conversational large language model by OpenAI designed for writing support, brainstorming, reasoning, and coding assistance.',
        field: 'Business & Productivity',
        role: 'Founder',
        use_case: 'Research',
        tool_type: 'Chatbot',
        difficulty: 'Beginner',
        access_type: 'Freemium',
        external_url: 'https://chatgpt.com',
        business_cta: 'Explore setting up an AI consulting business at Innovation City.',
        beginner_guide: 'Access the web interface, register an account, and enter conversational prompts directly in the chat bar.',
        beginner_prompt: 'Summarize this outline into a concise executive summary for a business proposal.',
        intermediate_guide: 'Utilize custom instructions and system personas to tailor ChatGPT outputs for specific brand voice and target demographics.',
        intermediate_prompt: 'Act as a senior business consultant. Analyze the following customer pain points and outline five distinct automation opportunities.',
        advanced_guide: 'Implement Custom GPTs, connect external APIs via actions, and use advanced system variables for custom workflow automation.',
        advanced_prompt: 'Create a JSON template schema to format output summaries for executive reporting, including keys for goals, metrics, and timeline.'
      },
      {
        name: 'Claude',
        description: 'Advanced AI assistant from Anthropic known for long-context understanding, high-quality writing, code generation, and complex analysis.',
        field: 'Business & Productivity',
        role: 'Founder',
        use_case: 'Document Analysis',
        tool_type: 'Writing Assistant',
        difficulty: 'Beginner',
        access_type: 'Freemium',
        external_url: 'https://claude.ai',
        business_cta: 'Explore setting up an AI consulting business at Innovation City.',
        beginner_guide: 'Navigate to the Claude interface and upload files (PDFs, text files, code snippets) to ask questions or extract summaries.',
        beginner_prompt: 'Explain the main concepts of the uploaded contract in bullet points.',
        intermediate_guide: 'Leverage Projects and Artifacts features to bundle related reference documents and build interactive code or document structures side-by-side.',
        intermediate_prompt: 'Draft an email newsletter based on the uploaded industry trends report, adhering to a professional tone and emphasizing key metrics.',
        advanced_guide: 'Construct multi-step analysis loops by feeding Claude formatted tables and code blocks, and utilize system prompts to isolate variable metrics.',
        advanced_prompt: 'Analyze this raw transaction data for anomaly detection. Identify records that deviate from the statistical mean and write a log in markdown.'
      },
      {
        name: 'GitHub Copilot',
        description: 'AI-powered code assistant that provides inline suggestions, documentation, and chat-based refactoring directly inside the IDE.',
        field: 'Software Development',
        role: 'Developer',
        use_case: 'Code Generation',
        tool_type: 'AI Agent',
        difficulty: 'Intermediate',
        access_type: 'Paid',
        external_url: 'https://github.com/features/copilot',
        business_cta: 'Explore technology-related license options for software startups at Innovation City.',
        beginner_guide: 'Install the extension in VS Code, authenticate with your GitHub account, and begin typing code to receive inline autocomplete suggestions.',
        beginner_prompt: 'Write a helper function to calculate the date difference in days between two JavaScript Date objects.',
        intermediate_guide: 'Use Copilot Chat in your editor to explain selected blocks of code, write unit tests, and debug runtime syntax errors.',
        intermediate_prompt: 'Generate Jest unit tests covering positive, negative, and edge cases for the user registration input validation function.',
        advanced_guide: 'Customize code suggestions using workspace configuration context and establish strict syntax rules with prompt files inside the repository.',
        advanced_prompt: 'Refactor this synchronous nested database query structure to use asynchronous promise aggregation, ensuring proper connection pool release.'
      },
      {
        name: 'Midjourney',
        description: 'Generative AI platform that creates highly detailed, high-resolution visual assets and artistic renders from textual prompt descriptions.',
        field: 'Design & Creative',
        role: 'Designer',
        use_case: 'Content Creation',
        tool_type: 'Image Generator',
        difficulty: 'Intermediate',
        access_type: 'Paid',
        external_url: 'https://midjourney.com',
        business_cta: 'Learn about media or content creation company setup at Innovation City.',
        beginner_guide: 'Join the Midjourney Discord server, enter a designated channel, and use the /imagine command followed by descriptive keywords.',
        beginner_prompt: 'A sleek modern corporate office lobby with glass windows, warm ambient lighting, high-end minimalist furniture, architectural photography.',
        intermediate_guide: 'Incorporate parameters such as aspect ratios (--ar), stylization values (--s), and image weight variables to achieve styling consistency.',
        intermediate_prompt: 'A minimalist tech startup logo icon representing growth, dark blue and light turquoise gradient, vector graphic style, isolated on white background --no mockups --ar 1:1',
        advanced_guide: 'Utilize character reference (--cref), style reference (--sref), and pan/zoom features to create coherent multi-frame campaign materials.',
        advanced_prompt: 'A high-end architectural rendering of a sustainable co-working campus in Dubai, photorealistic, cinematic lighting, 8k resolution --ar 16:9 --style raw --v 6.0'
      },
      {
        name: 'Zapier AI',
        description: 'Workflow automation utility that allows users to connect web applications, construct complex logic paths, and automate workflows using natural language instructions.',
        field: 'Operations & Automation',
        role: 'Operations Manager',
        use_case: 'Automation',
        tool_type: 'Automation Platform',
        difficulty: 'Beginner',
        access_type: 'Freemium',
        external_url: 'https://zapier.com',
        business_cta: 'Explore setting up an AI automation business at Innovation City.',
        beginner_guide: 'Log in to Zapier, click Create Zap, and describe the desired workflow trigger and action sequence in natural language.',
        beginner_prompt: 'When I receive a new lead in Google Sheets, send a personalized email confirmation via Gmail.',
        intermediate_guide: 'Implement multi-step Zaps containing filters, formatting steps, and conditional paths based on data variables extracted from the trigger.',
        intermediate_prompt: 'Trigger on new Typeform submission. If user role is executive, create a Deal in HubSpot and ping the sales channel in Slack, else log to CRM spreadsheet.',
        advanced_guide: 'Incorporate custom JavaScript code steps, webhook triggers, and Zapier AI Copilot actions to parse complex payloads and execute API operations.',
        advanced_prompt: 'Write a Zapier JS code step to parse a text block of invoice line items, extract quantities and prices, and output a structured JSON array for database import.'
      },
      {
        name: 'Jasper',
        description: 'Enterprise grade AI writing assistant optimized for marketing, SEO optimization, brand voice alignment, and blog post creation.',
        field: 'Marketing & Content',
        role: 'Marketer',
        use_case: 'Content Creation',
        tool_type: 'Writing Assistant',
        difficulty: 'Beginner',
        access_type: 'Paid',
        external_url: 'https://jasper.ai',
        business_cta: 'Learn about media or content creation company setup at Innovation City.',
        beginner_guide: 'Select from predefined marketing templates, input target keywords, choose a brand voice style, and generate content drafts.',
        beginner_prompt: 'Draft a short, engaging product announcement post for LinkedIn highlighting a new AI-powered document review feature.',
        intermediate_guide: 'Define and upload brand voice guidelines and product descriptions to generate marketing material across channels while maintaining styling consistency.',
        intermediate_prompt: 'Write a 500-word SEO-optimized blog post section targeting the keyword AI automation in operations, adopting an authoritative voice.',
        advanced_guide: 'Create custom multi-stage marketing campaigns that output social posts, email newsletters, and landing page copy simultaneously based on a single brief.',
        advanced_prompt: 'Analyze this product marketing brief and generate a comprehensive messaging framework including value propositions, headlines, and call-to-actions.'
      },
      {
        name: 'Cursor',
        description: 'An AI-first code editor fork of VS Code built to understand repository structures, answer project-wide queries, and write code changes automatically.',
        field: 'Software Development',
        role: 'Developer',
        use_case: 'Code Generation',
        tool_type: 'AI Agent',
        difficulty: 'Intermediate',
        access_type: 'Freemium',
        external_url: 'https://cursor.com',
        business_cta: 'Explore technology-related license options for software startups at Innovation City.',
        beginner_guide: 'Download Cursor, import your current VS Code settings, and press Ctrl+K inside any file to write or edit code with AI instructions.',
        beginner_prompt: 'Add an option to toggle the visibility of the sidebar navigation in this component.',
        intermediate_guide: 'Use the Ctrl+L terminal chat window and type @Files or @Folders to supply context about specific code dependencies to the model.',
        intermediate_prompt: 'Analyze the database connection code in @db.js and explain how to implement robust retry logic for transient connection drops.',
        advanced_guide: 'Utilize Composer mode (Ctrl+I) to direct the editor to make multi-file modifications concurrently across different architectural layers.',
        advanced_prompt: 'Implement a complete authentication check flow by editing the server configuration, adding route protection middleware, and updating user controller files.'
      },
      {
        name: 'Canva Magic Studio',
        description: 'Suite of built-in generative tools within Canva that assists with graphic editing, text-to-image conversion, background removal, and asset resizing.',
        field: 'Design & Creative',
        role: 'Designer',
        use_case: 'Content Creation',
        tool_type: 'Image Generator',
        difficulty: 'Beginner',
        access_type: 'Freemium',
        external_url: 'https://canva.com',
        business_cta: 'Learn about media or content creation company setup at Innovation City.',
        beginner_guide: 'Select Magic Studio in the side panel, upload an image, and choose background removal or image expansion to alter your canvas size.',
        beginner_prompt: 'Remove the distracting background elements behind the central product object in this photo.',
        intermediate_guide: 'Use Magic Write to draft captions or transform slides into comprehensive brochures with layout adjustments matching corporate design guidelines.',
        intermediate_prompt: 'Rewrite this product pitch deck summary to be more persuasive and fit within three distinct bullet points.',
        advanced_guide: 'Generate custom animation sequences and export design variants across preconfigured social media banner dimensions automatically.',
        advanced_prompt: 'Convert this text-heavy operational guide into an interactive layout outline, adjusting sizing and color templates automatically.'
      },
      {
        name: 'Julius AI',
        description: 'Advanced data analysis platform that writes and executes Python scripts in a sandboxed environment to visualize data and build regression models.',
        field: 'Data & Analytics',
        role: 'Sales Executive',
        use_case: 'Data & Analytics',
        tool_type: 'Analytics Tool',
        difficulty: 'Advanced',
        access_type: 'Freemium',
        external_url: 'https://julius.ai',
        business_cta: 'Start an AI consulting or data analysis business at Innovation City.',
        beginner_guide: 'Upload a CSV or Excel spreadsheet and write questions about the data to get automatic table summaries and basic charts.',
        beginner_prompt: 'Show me the correlation between monthly sales numbers and marketing spend using a simple scatter plot.',
        intermediate_guide: 'Perform outlier removal, fill missing data rows, and run advanced clustering analyses by instructing the analyzer to construct Python scripts.',
        intermediate_prompt: 'Clean the data by replacing missing values in the age column with the median age, and perform a segmentation analysis based on purchase history.',
        advanced_guide: 'Incorporate external forecasting scripts to train time-series prediction models and export fully formatted regression analysis reports.',
        advanced_prompt: 'Train a random forest regression model to forecast quarterly sales metrics based on seasonal trends, and export the feature importance metrics.'
      },
      {
        name: 'Fin (Intercom)',
        description: 'AI customer support chatbot designed to resolve user queries instantly by extracting answers directly from public support documentation.',
        field: 'Customer Support',
        role: 'Operations Manager',
        use_case: 'Customer Support',
        tool_type: 'Chatbot',
        difficulty: 'Intermediate',
        access_type: 'Paid',
        external_url: 'https://intercom.com/fin',
        business_cta: 'Explore setting up an AI consulting business at Innovation City.',
        beginner_guide: 'Connect your public Help Center documentation URL to the Intercom dashboard and toggle Fin to resolve customer chat queries automatically.',
        beginner_prompt: 'Ensure Fin only triggers when customers query refund policies or account cancellation procedures.',
        intermediate_guide: 'Construct customized fallback paths and routing workflows inside the Intercom canvas if Fin is unable to resolve queries with high confidence.',
        intermediate_prompt: 'If the customer query refers to enterprise pricing tiers and Fin cannot resolve it, route the chat to the Sales inbox and flag it as high priority.',
        advanced_guide: 'Incorporate external developer APIs inside Fin custom actions to retrieve account variables (e.g. order status) and serve personalized support info.',
        advanced_prompt: 'Configure a custom action to query our order status API endpoint using the customer email, parsing the response to answer shipping timeline questions.'
      },
      {
        name: 'Make.com',
        description: 'Visual workflow designer to automate complex integrations and operations, linking hundreds of SaaS tools together using drag-and-drop triggers.',
        field: 'Operations & Automation',
        role: 'Operations Manager',
        use_case: 'Automation',
        tool_type: 'Automation Platform',
        difficulty: 'Intermediate',
        access_type: 'Freemium',
        external_url: 'https://make.com',
        business_cta: 'Explore setting up an AI automation business at Innovation City.',
        beginner_guide: 'Create a new scenario, select your trigger application, configure connection settings, and connect a second action node.',
        beginner_prompt: 'Watch for new emails in Gmail with attachments, and save those attachments directly to a specific folder in Google Drive.',
        intermediate_guide: 'Use routers, filters, and standard formatting formulas to modify variables and route payloads along different logic pathways.',
        intermediate_prompt: 'Route incoming webhook payload based on department field: if Marketing send to Slack, if Finance parse data and write to Airtable.',
        advanced_guide: 'Design complex multi-scenario loops utilizing data stores, error handling directives, and direct API calls with custom HTTP modules.',
        advanced_prompt: 'Configure error handling routes with resume directives on my HTTP endpoint node to handle transient network drops during bulk data synchronization.'
      },
      {
        name: 'Copy.ai',
        description: 'Marketing writing platform that generates copy variations for ads, social posts, emails, and website landing pages to increase lead conversions.',
        field: 'Marketing & Content',
        role: 'Marketer',
        use_case: 'Content Creation',
        tool_type: 'Writing Assistant',
        difficulty: 'Beginner',
        access_type: 'Freemium',
        external_url: 'https://copy.ai',
        business_cta: 'Learn about media or content creation company setup at Innovation City.',
        beginner_guide: 'Enter details about your product, select the writing tone, choose the ad format, and click generate to retrieve multiple copy options.',
        beginner_prompt: 'Draft three different Facebook ad copy variations for an organic coffee brand, focusing on sustainablity.',
        intermediate_guide: 'Create custom brand guidelines and construct automated workflow sheets to generate product descriptions in bulk from spreadsheet listings.',
        intermediate_prompt: 'Generate email sequence subject lines and body copies for cold outreach targeting operations managers, focusing on cost savings.',
        advanced_guide: 'Create complex content workflows that ingest press releases, filter out executive quotes, and generate SEO-optimized articles and social campaigns.',
        advanced_prompt: 'Construct a workflow template to parse raw user interviews and write distinct customer persona profiles categorized by primary pain point.'
      },
      {
        name: 'Phind',
        description: 'Developer search engine that provides instant code explanations, debugging answers, and repository links from web searches.',
        field: 'Software Development',
        role: 'Developer',
        use_case: 'Research',
        tool_type: 'Chatbot',
        difficulty: 'Beginner',
        access_type: 'Free',
        external_url: 'https://phind.com',
        business_cta: 'Explore technology-related license options for software startups at Innovation City.',
        beginner_guide: 'Input developer questions directly into the search console to retrieve conversational answers with inline code blocks and source citations.',
        beginner_prompt: 'How do I perform a database migration in Node.js using knex?',
        intermediate_guide: 'Configure project filter profiles to restrict search results to official documentation sites and specific framework guidelines.',
        intermediate_prompt: 'Explain the difference between getServerSideProps and getStaticProps in Next.js, referencing pages router documentation.',
        advanced_guide: 'Connect local repository folders to feed context-aware structure logs, allowing Phind to answer complex project dependency queries.',
        advanced_prompt: 'Analyze this configuration file and debug the Docker build error where target directories are missing during multi-stage compiles.'
      },
      {
        name: 'IC Document Analyzer',
        description: 'Internal document processor developed to analyze legal documents, contracts, NDAs, and licensing applications for internal compliance.',
        field: 'Business & Productivity',
        role: 'Operations Manager',
        use_case: 'Document Analysis',
        tool_type: 'AI Agent',
        difficulty: 'Advanced',
        access_type: 'Internal-only',
        external_url: 'http://internal.innovationcity.local/analyzer',
        business_cta: 'Explore technology-related license options for software startups at Innovation City.',
        beginner_guide: 'Access the internal compliance server, upload a draft contract in PDF format, and click Start Audit to review compliance violations.',
        beginner_prompt: 'Check this NDA draft for standard liability cap clauses and highlight deviations.',
        intermediate_guide: 'Configure custom evaluation rules to target specific clause guidelines approved by the legal council for licensing applications.',
        intermediate_prompt: 'Analyze the licensing agreement against compliance handbook version 3.2. Identify missing indemnity clauses.',
        advanced_guide: 'Integrate the document analyzer API directly into our internal licensing CRM portal to automate document checks during file uploads.',
        advanced_prompt: 'Call document analyzer API endpoint via webhook on lead state changes, parsing JSON response for compliance validation flag.'
      },
      {
        name: 'IC Operations Assistant',
        description: 'Internal operational workflow bot that automatically parses internal support tickets, classifies priority, and assigns tickets to team owners.',
        field: 'Operations & Automation',
        role: 'Operations Manager',
        use_case: 'Automation',
        tool_type: 'AI Agent',
        difficulty: 'Intermediate',
        access_type: 'Internal-only',
        external_url: 'http://internal.innovationcity.local/ops-bot',
        business_cta: 'Explore setting up an AI automation business at Innovation City.',
        beginner_guide: 'Access the internal dashboard, view pending operations, and allow the assistant to categorize tickets or suggest assignments.',
        beginner_prompt: 'Categorize the queue of active tickets received this morning into operational and technical issues.',
        intermediate_guide: 'Establish custom routing tables inside settings to adjust assignees based on team workloads and specialized certifications.',
        intermediate_prompt: 'Assign incoming tickets containing billing variables to the Finance team queue and send email alerts.',
        advanced_guide: 'Construct API connectors to sync database metrics and trigger SMS emergency responses when high-priority system failures occur.',
        advanced_prompt: 'Integrate the ops assistant with our telemetry endpoints, triggering an incident ticket when average system latency exceeds 500ms.'
      },
      {
        name: 'IC Resume Parser',
        description: 'Internal tool designed to assist the recruitment team in parsing CVs, evaluating applicant skill sets, and matching profiles to open roles.',
        field: 'Business & Productivity',
        role: 'Operations Manager',
        use_case: 'Automation',
        tool_type: 'Writing Assistant',
        difficulty: 'Beginner',
        access_type: 'Internal-only',
        external_url: 'http://internal.innovationcity.local/hr-parser',
        business_cta: 'Start an AI consulting or data analysis business at Innovation City.',
        beginner_guide: 'Access the internal HR panel, upload candidates PDF resumes, and view the structured list of parsed skills and experience.',
        beginner_prompt: 'Extract the programming languages and work experience from the candidate resume.',
        intermediate_guide: 'Filter candidate list by cross-referencing candidate profiles against job description parameters, calculating a fit score.',
        intermediate_prompt: 'Match these five candidate resumes against the junior developer job profile and rank them by experience years.',
        advanced_guide: 'Export matched resume analytics directly to our HR database, triggering automatic interview invitations via API endpoints.',
        advanced_prompt: 'Build a CSV formatting script that structures resume data for automated importing into our work history registry database.'
      }
    ];

    for (const t of initialTools) {
      await db.run(`
        INSERT INTO tools (
          name, description, field, role, use_case, tool_type, difficulty, access_type, external_url, business_cta,
          beginner_guide, beginner_prompt, intermediate_guide, intermediate_prompt, advanced_guide, advanced_prompt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        t.name, t.description, t.field, t.role, t.use_case, t.tool_type, t.difficulty, t.access_type, t.external_url, t.business_cta,
        t.beginner_guide, t.beginner_prompt, t.intermediate_guide, t.intermediate_prompt, t.advanced_guide, t.advanced_prompt
      );
    }


    // Seed internal info for internal-only tools, and internal info for some public tools (e.g. ChatGPT, Claude, GitHub Copilot)
    const dbTools = await db.all('SELECT id, name FROM tools');
    
    // Internal information mappings
    const internalInfos = {
      'ChatGPT': {
        owner: 'IT Department',
        access_method: 'Shared Enterprise License via Okta SSO',
        cost: '$20/user/month',
        approval_status: 'Approved',
        internal_department: 'All Departments',
        support_contact: 'it-support@innovationcity.com',
        internal_notes: 'Usage must comply with corporate data governance guidelines. Do not input client-identifying information into public models.'
      },
      'Claude': {
        owner: 'IT Department',
        access_method: 'Enterprise API Access & Web UI SSO',
        cost: '$25/user/month',
        approval_status: 'Approved',
        internal_department: 'Marketing & Legal',
        support_contact: 'it-support@innovationcity.com',
        internal_notes: 'Approved for large document reviews. Avoid processing financial records unless anonymized.'
      },
      'GitHub Copilot': {
        owner: 'Engineering Dept',
        access_method: 'Admin-assigned license request form',
        cost: '$19/user/month',
        approval_status: 'Approved',
        internal_department: 'Software Development',
        support_contact: 'dev-admin@innovationcity.com',
        internal_notes: 'Ensure local codebase parsing telemetry is turned off in IDE settings to protect intellectual property.'
      },
      'IC Document Analyzer': {
        owner: 'Legal Team',
        access_method: 'Internal Portal Login',
        cost: 'Included in internal infrastructure budget',
        approval_status: 'Approved',
        internal_department: 'Legal & Compliance',
        support_contact: 'legal-tech@innovationcity.com',
        internal_notes: 'Proprietary server instance. High security data. Never expose API keys externally.'
      },
      'IC Operations Assistant': {
        owner: 'Operations Team',
        access_method: 'SSO Login via Operational Dashboard',
        cost: 'Internal infrastructure',
        approval_status: 'Approved',
        internal_department: 'Operations',
        support_contact: 'ops-lead@innovationcity.com',
        internal_notes: 'Used to manage ticket queues. Runs on local secure VMs.'
      },
      'IC Resume Parser': {
        owner: 'HR Department',
        access_method: 'HR Portal Access Rights',
        cost: 'Evaluating (trial version)',
        approval_status: 'Evaluating',
        internal_department: 'Human Resources',
        support_contact: 'hr-tech@innovationcity.com',
        internal_notes: 'Currently undergoing compliance review for data privacy. Access is restricted to HR leaders.'
      }
    };

    for (const tool of dbTools) {
      const info = internalInfos[tool.name];
      if (info) {
        await db.run(`
          INSERT INTO internal_tool_info (
            tool_id, owner, access_method, cost, approval_status, internal_department, support_contact, internal_notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          tool.id, info.owner, info.access_method, info.cost, info.approval_status, info.internal_department, info.support_contact, info.internal_notes
        );
      }
    }

    // Seed News
    const initialNews = [
      {
        title: 'Innovation City Announces AI Training Initiative for Local Startups',
        summary: 'A fully funded workshop series aimed at teaching founders how to integrate AI tools into their business operations and product models.',
        content: 'Innovation City is launching a comprehensive training schedule beginning next month. The program covers beginner-to-advanced AI implementation tracks, providing hands-on instruction in workflow automation, marketing content generation, and custom software integrations. Program participants will receive direct mentorship and business licensing consultation.',
        date_published: '2026-06-05',
        category: 'Innovation City Updates'
      },
      {
        title: 'Global AI Market Trends: Generative Agents Dominate Enterprise Tech',
        summary: 'Industry analysts report a significant shift towards autonomous AI agents in streamlining operations, support, and development.',
        content: 'The generative AI market is witnessing rapid evolution from simple chat interfaces to autonomous workflow agents. Companies that have implemented multi-agent architectures report up to a forty percent reduction in task completion times across departments. Industry leaders predict agent coordination platforms will dominate IT spend by the end of the year.',
        date_published: '2026-06-10',
        category: 'Market News'
      },
      {
        title: 'New Security Regulations Approved for Internal AI Deployments',
        summary: 'Innovation City compliance board outlines strict guidelines regarding database permissions and local data residency for AI models.',
        content: 'To safeguard corporate intelligence and user privacy, the Innovation City compliance committee has approved a new AI Governance framework. All internal AI deployments must store sensitive operational variables locally, utilize encrypted data channels, and enforce role-based access limits. Trial products must undergo a thorough vulnerability audit before deployment approval.',
        date_published: '2026-06-11',
        category: 'Innovation City Updates'
      }
    ];

    for (const n of initialNews) {
      await db.run('INSERT INTO news (title, summary, content, date_published, category) VALUES (?, ?, ?, ?, ?)',
        n.title, n.summary, n.content, n.date_published, n.category
      );
    }

    // Seed Events
    const initialEvents = [
      {
        title: 'AI Automation Workshop for Founders',
        description: 'Hands-on training session covering Make.com and Zapier setup. Learn to automate your operations and connect AI tools with zero coding.',
        date: '2026-06-18T10:00:00',
        location: 'Innovation City Center, Seminar Hall B',
        type: 'Workshop',
        resources_link: 'https://community.innovationcity.com/resources/automation-workshop'
      },
      {
        title: 'AI-First Startups Meetup',
        description: 'Connect with other founders, share prompts, show off AI prototypes, and discuss collaboration opportunities.',
        date: '2026-06-25T18:30:00',
        location: 'Innovation City Cafe',
        type: 'Meetup',
        resources_link: null
      },
      {
        title: 'AI Product Hackathon',
        description: 'A 48-hour sprint to build functional AI solutions. Top teams receive cash prizes and licensing support from the Business Development team.',
        date: '2026-07-03T09:00:00',
        location: 'Innovation City Co-working Space',
        type: 'Hackathon',
        resources_link: 'https://hackathon.innovationcity.com'
      },
      {
        title: 'Introduction to Prompt Engineering (Past Archive)',
        description: 'A fundamental webinar covering structured prompt creation, system role definitions, and output template modeling.',
        date: '2026-05-12T14:00:00',
        location: 'Recorded Online Session',
        type: 'Archive',
        resources_link: 'https://recorded-webinars.innovationcity.local/prompt-eng-basics'
      }
    ];

    for (const e of initialEvents) {
      await db.run('INSERT INTO events (title, description, date, location, type, resources_link) VALUES (?, ?, ?, ?, ?, ?)',
        e.title, e.description, e.date, e.location, e.type, e.resources_link
      );
    }

    console.log('Seeding completed successfully.');
  }

  await db.close();
}
