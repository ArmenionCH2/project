// ===== STATE =====
let currentFeedTab = 'lost';
let currentAdminTab = 'pending';
let selectedCategory = 'lost';
let isAdmin = false;

// Global tracker to preserve open state of dropdown comment threads during feed re-renders
let openCommentsState = {};

// Sample post data
let posts = [
  {
    id: 1, category: 'lost', username: 'john_khen', initials: 'JK',
    itemName: 'Black Umbrella', description: 'Left it near the library entrance, has a wooden handle.',
    location: 'Main Library, Ground Floor', time: 'June 3, 2026 · 9:14 AM',
    status: 'active', hasMedia: true, image: 'images/umbrella.jpg', comments: [
      { user: 'carlo_hilo', initials: 'CH', text: 'Is it a folding type?' }
    ]
  },
  {
    id: 2, category: 'found', username: 'carlo_hilo', initials: 'CH',
    itemName: 'Student ID Card', description: 'Found near the canteen. Name on card is partially visible.',
    location: 'Canteen Area', time: 'June 3, 2026 · 10:02 AM',
    status: 'active', hasMedia: true, image: 'images/idcard.jpg', comments: []
  },
  {
    id: 3, category: 'lost', username: 'justin_f', initials: 'JF',
    itemName: 'Scientific Calculator', description: 'Casio fx-991ES Plus, has a small scratch on the back cover.',
    location: 'Room 201, Engineering Bldg', time: 'June 2, 2026 · 3:45 PM',
    status: 'active', hasMedia: true, image: 'images/calculator.jpg', comments: [
      { user: 'john_khen', initials: 'JK', text: 'I think I saw one at the lost and found office!' }
    ]
  },
  {
    id: 4, category: 'found', username: 'john_khen', initials: 'JK',
    itemName: 'Water Bottle (Blue)', description: 'Tumbler with stickers, found near the gymnasium.',
    location: 'Gymnasium Entrance', time: 'June 1, 2026 · 1:30 PM',
    status: 'pending', hasMedia: true, image: 'images/waterbottle.jpg', comments: []
  },
  {
    id: 5, category: 'lost', username: 'carlo_hilo', initials: 'CH',
    itemName: 'Notebook (Math)', description: 'Green spiral notebook, has my name on the cover.',
    location: 'Room 305, CCS Building', time: 'May 31, 2026 · 11:00 AM',
    status: 'pending', hasMedia: true, image: 'images/notebook.jpg', comments: []
  },
  {
    id: 6, category: 'lost', username: 'justin_f', initials: 'JF',
    itemName: 'Earphones',
    description: 'White wired earphones, left at the computer lab.',
    location: 'Computer Lab 1', time: 'May 30, 2026 · 2:15 PM',
    status: 'resolved', hasMedia: true, image: 'images/earphones.png', comments: []
  }
];

// ===== NAVIGATION =====
function navigate(pageId) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  const target = document.getElementById(pageId);
  if (target) {
    target.style.display = 'flex';
    requestAnimationFrame(() => target.classList.add('active'));
  }

  if (pageId === 'page-main') renderFeed();
  if (pageId === 'page-profile') renderProfile();
  if (pageId === 'page-admin') renderAdminFeed();
}

function setAdmin() {
  isAdmin = true;
  document.querySelectorAll('[id^="admin-nav-btn"]').forEach(b => b.style.display = 'flex');
}

// ===== FEED =====
function switchTab(tab, btn) {
  currentFeedTab = tab;
  document.querySelectorAll('#page-main .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderFeed();
}

function renderFeed(filter = '') {
  const container = document.getElementById('feed-content');
  const filtered = posts.filter(p =>
    p.category === currentFeedTab &&
    p.status === 'active' &&
    (filter === '' ||
      p.itemName.toLowerCase().includes(filter.toLowerCase()) ||
      p.description.toLowerCase().includes(filter.toLowerCase()) ||
      p.location.toLowerCase().includes(filter.toLowerCase()))
  );

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${currentFeedTab === 'lost' ? '🔎' : '📦'}</div>
        <p>No ${currentFeedTab} items found.</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map((p, i) => {
    const isCommentsOpen = openCommentsState[p.id] || false;
    return `
    <div class="post-card" style="animation-delay:${i * 0.05}s">
      <div class="post-card-header">
        <div class="post-avatar">${p.initials}</div>
        <div class="post-meta">
          <div class="post-username">${p.username}</div>
          <div class="post-time">${p.time}</div>
        </div>
        <span class="post-badge badge-${p.category}">${p.category}</span>
      </div>
      <div class="post-item-name">${p.itemName}</div>
      <div class="post-desc">${p.description}</div>
      <div class="post-location"><span>📍</span> ${p.location}</div>
      ${p.hasMedia ? `<div class="post-media-thumb"><img src="${p.image}" alt="${p.itemName}" onerror="this.parentElement.innerHTML='🖼️ Photo attached'" /></div>` : ''}
      
      <div class="dropdown-toggle-bar" onclick="toggleCommentsDropdown(${p.id})">
        <span class="toggle-text">💬 Comments (${p.comments.length})</span>
        <span class="toggle-arrow ${isCommentsOpen ? 'rotated' : ''}">▼</span>
      </div>

      <div class="comments-dropdown-wrapper ${isCommentsOpen ? 'open' : ''}" id="dropdown-${p.id}">
        <div class="dropdown-inner-content">
          <div class="comments-stack">
            ${p.comments.length === 0 ? 
              `<p class="no-comments-msg">No comments yet. Start the conversation!</p>` : 
              p.comments.map(c => `
                <div class="comment-item">
                  <div class="comment-avatar">${c.initials}</div>
                  <div class="comment-body">
                    <div class="comment-user">${c.user}</div>
                    <div class="comment-text">${c.text}</div>
                  </div>
                </div>
              `).join('')
            }
          </div>
          <div class="comment-input-row">
            <input type="text" placeholder="Add a comment..." id="input-${p.id}" onkeypress="if(event.key==='Enter') addDropdownComment(${p.id})" />
            <button onclick="addDropdownComment(${p.id})">Send</button>
          </div>
        </div>
      </div>
    </div>
  `}).join('');
}

function filterPosts() {
  const val = document.getElementById('search-input').value;
  renderFeed(val);
}

// ===== INTERACTIVE DROPDOWN DRIVERS =====
function toggleCommentsDropdown(postId) {
  const wrapper = document.getElementById(`dropdown-${postId}`);
  const arrow = wrapper.previousElementSibling.querySelector('.toggle-arrow');
  
  if (wrapper.classList.contains('open')) {
    wrapper.classList.remove('open');
    arrow.classList.remove('rotated');
    openCommentsState[postId] = false;
  } else {
    wrapper.classList.add('open');
    arrow.classList.add('rotated');
    openCommentsState[postId] = true;
  }
}

function addDropdownComment(postId) {
  const input = document.getElementById(`input-${postId}`);
  const text = input.value.trim();
  if (!text) return;

  const post = posts.find(p => p.id === postId);
  if (!post) return;

  post.comments.push({ user: 'john_khen', initials: 'JK', text });
  input.value = '';
  
  // Refresh standard layout
  renderFeed(document.getElementById('search-input').value);
}

// ===== POST SUBMISSION =====
function selectCategory(cat) {
  selectedCategory = cat;
  document.getElementById('cat-lost').className = 'cat-btn' + (cat === 'lost' ? ' active lost-active' : '');
  document.getElementById('cat-found').className = 'cat-btn' + (cat === 'found' ? ' active found-active' : '');
}

// Init category styling
if (document.getElementById('cat-lost')) {
  document.getElementById('cat-lost').className = 'cat-btn active lost-active';
}

function submitPost() {
  const name = document.getElementById('post-name').value.trim();
  const desc = document.getElementById('post-desc').value.trim();
  const loc = document.getElementById('post-location').value.trim();

  if (!name || !loc) {
    showToast('⚠️ Item name and location are required.');
    return;
  }

  const now = new Date();
  const timeStr = now.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) +
    ' · ' + now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

  posts.unshift({
    id: Date.now(),
    category: selectedCategory,
    username: 'john_khen',
    initials: 'JK',
    itemName: name,
    description: desc || 'No description provided.',
    location: loc,
    time: timeStr,
    status: 'pending',
    hasMedia: false,
    comments: []
  });

  document.getElementById('post-name').value = '';
  document.getElementById('post-desc').value = '';
  document.getElementById('post-location').value = '';

  showToast('✅ Post submitted! Awaiting admin approval.');
  setTimeout(() => navigate('page-main'), 800);
}

// ===== PROFILE =====
function renderProfile() {
  const myPosts = posts.filter(p => p.username === 'john_khen');
  const container = document.getElementById('my-posts-list');

  document.getElementById('stat-lost').textContent = myPosts.filter(p => p.category === 'lost').length;
  document.getElementById('stat-found').textContent = myPosts.filter(p => p.category === 'found').length;
  document.getElementById('stat-resolved').textContent = myPosts.filter(p => p.status === 'resolved').length;

  if (myPosts.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>No posts yet.</p></div>`;
    return;
  }

  container.innerHTML = myPosts.map(p => `
    <div class="my-post-row">
      <span class="post-badge badge-${p.status === 'resolved' ? 'resolved' : p.category}" style="flex-shrink:0;">${p.category}</span>
      <div class="my-post-info">
        <div class="my-post-name">${p.itemName}</div>
        <div class="my-post-meta">${p.time} · <span style="color: ${p.status === 'active' ? 'var(--found-color)' : p.status === 'pending' ? 'var(--pending-color)' : 'var(--text-muted)'}">${p.status}</span></div>
      </div>
      ${p.status === 'active' ?
        `<button class="btn-resolve-own" onclick="resolvePost(${p.id})">Resolve</button>` :
        ''}
    </div>
  `).join('');
}

function resolvePost(postId) {
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.status = 'resolved';
    renderProfile();
    showToast('✅ Post marked as resolved!');
  }
}

// ===== ADMIN PANEL =====
function switchAdminTab(tab, btn) {
  currentAdminTab = tab;
  document.querySelectorAll('#page-admin .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAdminFeed();
}

function renderAdminFeed() {
  const container = document.getElementById('admin-feed-content');
  const filtered = posts.filter(p => p.status === currentAdminTab);

  // Update stat boxes
  document.getElementById('a-pending').textContent = posts.filter(p => p.status === 'pending').length;
  document.getElementById('a-active').textContent = posts.filter(p => p.status === 'active').length;
  document.getElementById('a-resolved').textContent = posts.filter(p => p.status === 'resolved').length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>No ${currentAdminTab} posts.</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map((p, i) => `
    <div class="post-card" style="animation-delay:${i * 0.05}s; cursor:default;">
      <div class="post-card-header">
        <div class="post-avatar">${p.initials}</div>
        <div class="post-meta">
          <div class="post-username">${p.username}</div>
          <div class="post-time">${p.time}</div>
        </div>
        <span class="post-badge badge-${p.category}">${p.category}</span>
      </div>
      <div class="post-item-name">${p.itemName}</div>
      <div class="post-desc">${p.description}</div>
      <div class="post-location"><span>📍</span> ${p.location}</div>
      ${currentAdminTab === 'pending' ? `
        <div class="post-actions">
          <button class="btn-approve" onclick="adminAction(${p.id}, 'approve')">✓ Approve</button>
          <button class="btn-reject" onclick="adminAction(${p.id}, 'reject')">✕ Reject</button>
        </div>
      ` : currentAdminTab === 'active' ? `
        <div class="post-actions">
          <button class="btn-resolve-admin" disabled>🔒 Reporter resolves only</button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function adminAction(postId, action) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  if (action === 'approve') {
    post.status = 'active';
    showToast('✅ Post approved and published!');
  } else if (action === 'reject') {
    posts = posts.filter(p => p.id !== postId);
    showToast('🗑️ Post rejected and removed.');
  }

  renderAdminFeed();
}

// ===== TOAST =====
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== INIT =====
navigate('page-register');
