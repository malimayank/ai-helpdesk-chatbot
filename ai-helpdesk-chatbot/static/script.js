const defaultConfig = {
  company_name: 'TechCorp IT',
  welcome_message: 'Hello! I\'m your IT support assistant. How can I help you today?',
  bot_name: 'Alex',
};

let config = { ...defaultConfig };
let tickets = [];
let messages = [];
let selectedPriority = 'medium';
let isProcessing = false;

// Knowledge Base - AI Brain
const knowledgeBase = {
  password: {
    keywords: ['password', 'reset', 'forgot', 'change password', 'locked out', 'cant login'],
    response: `I can help you with password issues! Here's what you can try:

**Step 1:** Go to the company login portal
**Step 2:** Click "Forgot Password" below the login form
**Step 3:** Enter your work email address
**Step 4:** Check your email for a reset link (including spam folder)
**Step 5:** Create a new password (min 8 chars, 1 number, 1 special char)

⏱️ The reset link expires in 24 hours.

Did this solve your issue?`,
    followUp: 'If you\'re still having trouble, I can create a support ticket to have IT manually reset your password.'
  },
  internet: {
    keywords: ['internet', 'wifi', 'network', 'connection', 'slow', 'disconnect', 'no internet', 'cant connect'],
    response: `Let's troubleshoot your internet connection:

**Step 1:** Check if other devices can connect
**Step 2:** Restart your computer
**Step 3:** Disconnect and reconnect to the network
**Step 4:** Forget the network and re-enter credentials
**Step 5:** Try connecting via ethernet if available

🔧 **Quick Fix:** Press Win+R, type "ncpa.cpl", right-click your adapter → Disable, wait 10 seconds, then Enable.

Is your connection working now?`,
    followUp: 'If the issue persists, it might be a network infrastructure problem. I can escalate this to our network team.'
  },
  software: {
    keywords: ['software', 'error', 'crash', 'not working', 'application', 'program', 'install', 'update', 'bug'],
    response: `I'll help you resolve this software issue:

**Step 1:** Close the application completely
**Step 2:** Check Task Manager (Ctrl+Shift+Esc) for any running processes
**Step 3:** Clear the application cache/temp files
**Step 4:** Run the application as Administrator
**Step 5:** Check for available updates

🔄 **If it keeps crashing:** Try repairing the installation via Control Panel → Programs → Repair.

What application are you having trouble with?`,
    followUp: 'If the problem continues, I can create a ticket for our software team to investigate further.'
  },
  login: {
    keywords: ['login', 'sign in', 'access', 'authentication', 'cant access', 'denied', 'unauthorized'],
    response: `Let's fix your login issue:

**Step 1:** Verify you're using the correct username (usually your email)
**Step 2:** Check if Caps Lock is on
**Step 3:** Clear browser cookies and cache
**Step 4:** Try a different browser or incognito mode
**Step 5:** Check if your account is active in the directory

🔐 **Account locked?** Wait 30 minutes for automatic unlock, or contact IT.

Which system are you trying to access?`,
    followUp: 'If you\'re still locked out, I can escalate to have your account verified and unlocked.'
  },
  hardware: {
    keywords: ['hardware', 'screen', 'keyboard', 'mouse', 'monitor', 'printer', 'broken', 'not responding'],
    response: `For hardware issues, here are some initial steps:

**Step 1:** Check all cable connections
**Step 2:** Try restarting the device
**Step 3:** Test with different cables/ports if available
**Step 4:** Check Device Manager for driver issues
**Step 5:** Try the hardware on a different computer

🔌 **Power issues?** Try a different outlet or power strip.

What specific hardware is causing problems?`,
    followUp: 'Hardware issues often require physical inspection. I can create a ticket for an IT technician to assist you.'
  }
};

// ============================================
// MESSAGE FUNCTIONS
// ============================================

// Detect user intent (What type of issue is it?)
function detectIntent(message) {
  const lowerMessage = message.toLowerCase();
  for (const [category, data] of Object.entries(knowledgeBase)) {
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword)) {
        return category;
      }
    }
  }
  return null;
}

// Generate AI response
function generateResponse(userMessage) {
  const intent = detectIntent(userMessage);
  
  if (intent && knowledgeBase[intent]) {
    return {
      text: knowledgeBase[intent].response,
      followUp: knowledgeBase[intent].followUp,
      intent: intent,
      showEscalate: true
    };
  }
  
  return {
    text: `I understand you're experiencing an issue. To help you better, could you please provide more details about:

• **What** exactly is happening?
• **When** did it start?
• **What** error messages (if any) are you seeing?

Or you can use the **Quick Actions** on the left to select your issue type.`,
    showEscalate: true,
    intent: 'general'
  };
}

// Add message to chat
function addMessage(text, isUser = false, showEscalate = false) {
  const chatContainer = document.getElementById('chat-container');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'message-user' : 'message-bot'}`;
  
  const currentBotName = config.bot_name || defaultConfig.bot_name;
  
  if (isUser) {
    messageDiv.innerHTML = `
      <div class="message-bubble">${escapeHtml(text)}</div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="message-bot-wrapper">
        <div class="message-bot-avatar">🤖</div>
        <div class="message-bot-content">
          <div class="message-bot-name">${currentBotName}</div>
          <div class="message-bubble">${formatMarkdown(text)}</div>
          ${showEscalate ? `
            <div class="message-actions">
              <button class="action-button" onclick="showCreateTicketModal()">🎫 Create Ticket</button>
              <button class="action-button" onclick="sendThankYou()">✅ Issue Resolved</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  messages.push({ text, isUser, timestamp: new Date().toISOString() });
}

// Show typing indicator (bot is thinking...)
function showTypingIndicator() {
  const chatContainer = document.getElementById('chat-container');
  const typingDiv = document.createElement('div');
  typingDiv.id = 'typing-indicator';
  typingDiv.className = 'message message-bot';
  typingDiv.innerHTML = `
    <div class="message-bot-wrapper">
      <div class="message-bot-avatar">🤖</div>
      <div class="message-bot-content">
        <div class="message-bot-name">${config.bot_name || defaultConfig.bot_name}</div>
        <div class="message-bubble">
          <div class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      </div>
    </div>
  `;
  chatContainer.appendChild(typingDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Remove typing indicator
function hideTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}

// Escape HTML (security)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Format text with markdown-like styling
function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

// Handle user message
async function handleUserMessage(message) {
  if (isProcessing || !message.trim()) return;
  
  isProcessing = true;
  addMessage(message, true);
  
  // Show thinking indicator
  showTypingIndicator();
  
  // Simulate AI thinking time (1-2 seconds)
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  hideTypingIndicator();
  
  // Generate and show response
  const response = generateResponse(message);
  addMessage(response.text, false, response.showEscalate);
  
  isProcessing = false;
}

// Quick action buttons (sidebar)
function handleQuickAction(type) {
  const queries = {
    password: 'I need help resetting my password',
    internet: 'I\'m having internet connection problems',
    software: 'I\'m experiencing a software error',
    login: 'I can\'t log into my account'
  };
  
  const input = document.getElementById('chat-input');
  input.value = queries[type] || '';
  document.getElementById('chat-form').dispatchEvent(new Event('submit'));
}

// User says issue is resolved
function sendThankYou() {
  addMessage('Great, I\'m glad I could help! If you have any other IT issues in the future, don\'t hesitate to reach out. Have a great day! 👋', false, false);
}

// ============================================
// TICKET MANAGEMENT FUNCTIONS
// ============================================

// Show tickets modal
function showTicketsModal() {
  const modal = document.getElementById('tickets-modal');
  modal.classList.remove('hidden');
  renderTicketsList();
}

// Hide tickets modal
function hideTicketsModal() {
  const modal = document.getElementById('tickets-modal');
  modal.classList.add('hidden');
}

// Show create ticket modal
function showCreateTicketModal() {
  const modal = document.getElementById('create-ticket-modal');
  modal.classList.remove('hidden');
  setPriority('medium');
}

// Hide create ticket modal
function hideCreateTicketModal() {
  const modal = document.getElementById('create-ticket-modal');
  modal.classList.add('hidden');
  document.getElementById('ticket-form').reset();
}

// Set priority level
function setPriority(priority) {
  selectedPriority = priority;
  ['low', 'medium', 'high'].forEach(p => {
    const btn = document.getElementById(`priority-${p}`);
    if (p === priority) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Get priority color
function getPriorityColor(priority) {
  const colors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444'
  };
  return colors[priority] || colors.medium;
}

// Create new ticket
async function createTicket(e) {
  e.preventDefault();
  
  // Check if we're using the Data SDK
  if (!window.dataSdk) {
    // Fallback: create ticket in memory (no persistence)
    const ticketData = {
      ticket_id: 'TKT-' + Date.now().toString(36).toUpperCase(),
      issue_type: document.getElementById('ticket-type').value,
      description: document.getElementById('ticket-desc').value || 'No description provided',
      priority: selectedPriority,
      status: 'open',
      created_at: new Date().toISOString(),
      escalated: true
    };
    
    tickets.push(ticketData);
    hideCreateTicketModal();
    addMessage(`✅ **Ticket Created Successfully!**

**Ticket ID:** ${ticketData.ticket_id}
**Priority:** ${ticketData.priority.toUpperCase()}
**Type:** ${ticketData.issue_type}

A member of our IT team will review your ticket and get back to you shortly.`, false, false);
    updateStats();
    return;
  }
  
  const submitBtn = document.getElementById('submit-ticket-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span>Creating...</span>';
  
  const ticketData = {
    ticket_id: 'TKT-' + Date.now().toString(36).toUpperCase(),
    issue_type: document.getElementById('ticket-type').value,
    description: document.getElementById('ticket-desc').value || 'No description provided',
    priority: selectedPriority,
    status: 'open',
    created_at: new Date().toISOString(),
    escalated: true
  };
  
  const result = await window.dataSdk.create(ticketData);
  
  submitBtn.disabled = false;
  submitBtn.innerHTML = 'Create Ticket';
  
  if (result.isOk) {
    hideCreateTicketModal();
    addMessage(`✅ **Ticket Created Successfully!**

**Ticket ID:** ${ticketData.ticket_id}
**Priority:** ${ticketData.priority.toUpperCase()}
**Type:** ${ticketData.issue_type}

A member of our IT team will review your ticket and get back to you shortly. You can track your ticket status using the "View Tickets" button.`, false, false);
  } else {
    addMessage('❌ Failed to create ticket. Please try again.', false, false);
  }
}

// Render tickets list
function renderTicketsList() {
  const container = document.getElementById('tickets-list');
  
  if (tickets.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎫</div>
        <div class="empty-state-title">No tickets yet</div>
        <div class="empty-state-desc">Create a ticket when you need human support</div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = tickets.map(ticket => {
    return `
      <div class="ticket-card">
        <div class="ticket-card-header">
          <span class="ticket-id">${ticket.ticket_id}</span>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="ticket-priority priority-${ticket.priority}">${ticket.priority}</span>
            <span class="ticket-status">${ticket.status}</span>
          </div>
        </div>
        <div class="ticket-type">${ticket.issue_type}</div>
        <div class="ticket-time">${new Date(ticket.created_at).toLocaleString()}</div>
      </div>
    `;
  }).join('');
}

// Update stats in sidebar
function updateStats() {
  const open = tickets.filter(t => t.status === 'open').length;
  const pending = tickets.filter(t => t.status === 'pending').length;
  const resolved = tickets.filter(t => t.status === 'resolved').length;
  
  document.getElementById('open-tickets').textContent = open;
  document.getElementById('pending-tickets').textContent = pending;
  document.getElementById('resolved-tickets').textContent = resolved;
}

// ============================================
// DATA PERSISTENCE (Optional)
// ============================================

// Data handler for Canva Data SDK
const dataHandler = {
  onDataChanged(data) {
    tickets = data;
    updateStats();
    renderTicketsList();
  }
};

// ============================================
// INITIALIZATION
// ============================================

// Initialize the app
async function init() {
  // Update UI with config
  document.getElementById('company-name').textContent = config.company_name || defaultConfig.company_name;
  document.getElementById('bot-name').textContent = config.bot_name || defaultConfig.bot_name;
  
  // Try to initialize Data SDK if available
  if (window.dataSdk) {
    const dataResult = await window.dataSdk.init(dataHandler);
    if (!dataResult.isOk) {
      console.error('Failed to initialize data SDK');
    }
  }
  
  // Add welcome message
  const welcomeMsg = config.welcome_message || defaultConfig.welcome_message;
  addMessage(welcomeMsg + '\n\nYou can describe your issue in the chat, or use the **Quick Actions** on the left to get started.', false, false);
  
  // Form submission handler
  document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (message) {
      handleUserMessage(message);
      input.value = '';
    }
  });
  
  // Ticket form submission handler
  document.getElementById('ticket-form').addEventListener('submit', createTicket);
  
  // Close modals when clicking outside
  document.getElementById('tickets-modal').addEventListener('click', (e) => {
    if (e.target.id === 'tickets-modal') {
      hideTicketsModal();
    }
  });
  
  document.getElementById('create-ticket-modal').addEventListener('click', (e) => {
    if (e.target.id === 'create-ticket-modal') {
      hideCreateTicketModal();
    }
  });
}

// Start when page loads
document.addEventListener('DOMContentLoaded', init);