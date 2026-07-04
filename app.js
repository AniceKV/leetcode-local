// Application State
let state = {
  companies: [],             // All loaded companies from metadata
  filteredCompanies: [],     // Companies filtered by search
  companySortKey: 'name',    // 'name' or 'count'
  companySortDir: 'asc',     // 'asc' or 'desc' for name, 'desc' or 'asc' for count

  selectedCompany: null,     // Selected company object
  selectedTimeframe: 'all',  // Active timeframe file
  
  questions: [],             // Active company questions
  filteredQuestions: [],     // Questions filtered by search/difficulty
  sortColumn: 'frequency',   // Active sort column
  sortDirection: 'desc',     // 'asc' or 'desc'
  
  currentPage: 1,
  pageSize: 50,
  aggregatedQuestions: null, // Cached aggregated all companies data
  questionTags: {},          // Mapped question tags {id: [tags]}
  availableTags: [],         // List of unique tags
  solvedQuestionIds: new Set() // Synced LeetCode solved frontend question IDs (integers)
};

// DOM Elements
const elements = {
  companySearch: document.getElementById('company-search'),
  clearSearchBtn: document.getElementById('clear-search-btn'),
  sortNameBtn: document.getElementById('sort-name-btn'),
  sortCountBtn: document.getElementById('sort-count-btn'),
  companyList: document.getElementById('company-list'),
  
  emptyState: document.getElementById('empty-state'),
  dashboardView: document.getElementById('dashboard-view'),
  
  companyAvatar: document.getElementById('company-avatar'),
  companyName: document.getElementById('selected-company-name'),
  companyPath: document.getElementById('company-path'),
  timeframeTabs: document.getElementById('timeframe-tabs'),
  
  statsTotalCount: document.getElementById('stats-total-count'),
  barEasy: document.getElementById('bar-easy'),
  barMedium: document.getElementById('bar-medium'),
  barHard: document.getElementById('bar-hard'),
  countEasy: document.getElementById('count-easy'),
  countMedium: document.getElementById('count-medium'),
  countHard: document.getElementById('count-hard'),
  statsAvgAcceptance: document.getElementById('stats-avg-acceptance'),
  
  questionSearch: document.getElementById('question-search'),
  difficultyFilter: document.getElementById('difficulty-filter'),
  tagFilter: document.getElementById('tag-filter'),
  statusFilter: document.getElementById('status-filter'),
  
  questionsTable: document.getElementById('questions-table'),
  tableBody: document.getElementById('table-body'),
  tableLoading: document.getElementById('table-loading'),
  tableEmpty: document.getElementById('table-empty'),
  
  paginationInfo: document.getElementById('pagination-info'),
  pageSize: document.getElementById('page-size'),
  prevPageBtn: document.getElementById('prev-page-btn'),
  nextPageBtn: document.getElementById('next-page-btn'),
  pageNumbers: document.getElementById('page-numbers'),

  // Sync Modal DOM elements
  syncSolvedBtn: document.getElementById('sync-solved-btn'),
  syncSolvedText: document.getElementById('sync-solved-text'),
  syncModal: document.getElementById('sync-modal'),
  closeModalBtn: document.getElementById('close-modal-btn'),
  modalTabAutoBtn: document.getElementById('modal-tab-auto-btn'),
  modalTabManualBtn: document.getElementById('modal-tab-manual-btn'),
  syncTabAuto: document.getElementById('sync-tab-auto'),
  syncTabManual: document.getElementById('sync-tab-manual'),
  leetcodeCookie: document.getElementById('leetcode-cookie'),
  autoSyncBtn: document.getElementById('auto-sync-btn'),
  copySnippetBtn: document.getElementById('copy-snippet-btn'),
  manualSolvedIds: document.getElementById('manual-solved-ids'),
  manualSyncBtn: document.getElementById('manual-sync-btn'),
  syncStatusMsg: document.getElementById('sync-status-msg'),
  modalFooterActions: document.getElementById('modal-footer-actions'),
  clearSyncBtn: document.getElementById('clear-sync-btn')
};

// Start the application
async function init() {
  setupEventListeners();
  // Populate manual console snippet via JS to avoid HTML parse errors from angle brackets
  const snippetEl = document.getElementById('manual-console-code');
  if (snippetEl) {
    snippetEl.textContent = `fetch('/api/problems/all/').then(r=>r.json()).then(d=>{let ids=d.stat_status_pairs.filter(p=>p.status==='ac').map(p=>p.stat.frontend_question_id);console.log('Found '+ids.length+' solved');console.log(JSON.stringify(ids));try{copy(JSON.stringify(ids));console.log('Copied!')}catch(e){}}).catch(e=>console.error('Error:',e))`;
  }
  loadSyncedSolvedQuestions();
  await loadQuestionTags();
  await loadCompaniesMetadata();
}

// Load synced solved status from localStorage
function loadSyncedSolvedQuestions() {
  try {
    const solvedIdsJson = localStorage.getItem('leetcode_solved_ids');
    if (solvedIdsJson) {
      const ids = JSON.parse(solvedIdsJson);
      if (Array.isArray(ids)) {
        state.solvedQuestionIds = new Set(ids.map(Number));
        
        // Update Header Pill
        elements.syncSolvedBtn.classList.add('active-sync');
        elements.syncSolvedText.textContent = `${state.solvedQuestionIds.size} Solved`;
        
        // Show footer clear actions in modal
        if (elements.modalFooterActions) {
          elements.modalFooterActions.style.display = 'flex';
        }
        return;
      }
    }
  } catch (e) {
    console.error('Error loading solved questions from localStorage:', e);
  }
  
  state.solvedQuestionIds = new Set();
  elements.syncSolvedBtn.classList.remove('active-sync');
  elements.syncSolvedText.textContent = 'Sync Solved';
  if (elements.modalFooterActions) {
    elements.modalFooterActions.style.display = 'none';
  }
}

// Show a status message in the modal
function showSyncStatus(text, type) {
  if (elements.syncStatusMsg) {
    elements.syncStatusMsg.className = `sync-status-msg ${type}`;
    elements.syncStatusMsg.textContent = text;
    elements.syncStatusMsg.style.display = 'flex';
  }
}

// Close the modal dialog
function closeSyncModal() {
  if (elements.syncModal) {
    elements.syncModal.style.display = 'none';
  }
  if (elements.syncStatusMsg) {
    elements.syncStatusMsg.style.display = 'none';
  }
}

// Open the modal dialog
function openSyncModal() {
  if (elements.syncModal) {
    elements.syncModal.style.display = 'flex';
  }
  if (elements.syncStatusMsg) {
    elements.syncStatusMsg.style.display = 'none';
  }
  if (elements.leetcodeCookie) {
    elements.leetcodeCookie.value = '';
  }
  if (elements.manualSolvedIds) {
    elements.manualSolvedIds.value = '';
  }
  
  // Update footer actions display based on active sync state
  if (elements.modalFooterActions) {
    if (state.solvedQuestionIds && state.solvedQuestionIds.size > 0) {
      elements.modalFooterActions.style.display = 'flex';
    } else {
      elements.modalFooterActions.style.display = 'none';
    }
  }
}

// Toggle question solved state in Set and localStorage
function toggleQuestionSolved(qId, isChecked) {
  if (isChecked) {
    state.solvedQuestionIds.add(qId);
  } else {
    state.solvedQuestionIds.delete(qId);
  }
  
  // Persist to localStorage
  const solvedIdsArray = Array.from(state.solvedQuestionIds);
  localStorage.setItem('leetcode_solved_ids', JSON.stringify(solvedIdsArray));
  
  // Update Header Pill
  if (elements.syncSolvedBtn && elements.syncSolvedText) {
    if (state.solvedQuestionIds.size > 0) {
      elements.syncSolvedBtn.classList.add('active-sync');
      elements.syncSolvedText.textContent = `${state.solvedQuestionIds.size} Solved`;
    } else {
      elements.syncSolvedBtn.classList.remove('active-sync');
      elements.syncSolvedText.textContent = 'Sync Solved';
    }
  }
  
  // Update footer actions display in modal
  if (elements.modalFooterActions) {
    elements.modalFooterActions.style.display = state.solvedQuestionIds.size > 0 ? 'flex' : 'none';
  }
  
  // Recalculate stats cards
  calculateDashboardStats();
  
  // If active filter is set to solved/unsolved, refresh search
  const statusFilter = elements.statusFilter ? elements.statusFilter.value : 'all';
  if (statusFilter !== 'all') {
    applyFiltersAndSort();
  }
}

// Load LeetCode tags mapping
async function loadQuestionTags() {
  try {
    const response = await fetch('/question_tags.json');
    if (!response.ok) throw new Error('Failed to load question tags.');
    state.questionTags = await response.json();
    
    // Gather all unique tags
    const allTags = new Set();
    Object.values(state.questionTags).forEach(tags => {
      tags.forEach(t => allTags.add(t));
    });
    
    state.availableTags = Array.from(allTags).sort();
    
    // Populate tag filter dropdown
    elements.tagFilter.innerHTML = '<option value="all">All Tags</option>';
    state.availableTags.forEach(tag => {
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = tag;
      elements.tagFilter.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading tags:', error);
    elements.tagFilter.innerHTML = '<option value="all">Error loading tags</option>';
  }
}

// Load companies index
async function loadCompaniesMetadata() {
  try {
    const response = await fetch('/companies_metadata.json');
    if (!response.ok) throw new Error('Failed to load companies metadata.');
    state.companies = await response.json();
    state.filteredCompanies = [...state.companies];
    
    // Default count sort desc for better discovery initially
    state.companySortKey = 'count';
    state.companySortDir = 'desc';
    
    // Update sort button styling
    elements.sortNameBtn.classList.remove('active');
    elements.sortCountBtn.classList.add('active');
    
    updateSortIcons();
    renderCompanyList();
  } catch (error) {
    console.error('Error loading metadata:', error);
    elements.companyList.innerHTML = `<div class="loading-state">
      <i data-lucide="alert-circle" style="color: var(--diff-hard)"></i>
      <p>Error loading companies metadata. Make sure you run from local Vite server.</p>
    </div>`;
    lucide.createIcons();
  }
}

// Render company list in sidebar
function renderCompanyList() {
  // Sort companies first
  const sorted = [...state.filteredCompanies].sort((a, b) => {
    if (state.companySortKey === 'name') {
      const cmp = a.name.localeCompare(b.name);
      return state.companySortDir === 'asc' ? cmp : -cmp;
    } else {
      // Sort by total questions count ('all' file if present, or first available)
      const countA = a.files.all || Object.values(a.files)[0] || 0;
      const countB = b.files.all || Object.values(b.files)[0] || 0;
      const cmp = countA - countB;
      return state.companySortDir === 'desc' ? cmp : -cmp;
    }
  });

  elements.companyList.innerHTML = '';

  // Prepend "All Companies" special link if search is empty or matches 'all'
  const query = elements.companySearch.value.trim().toLowerCase();
  if (!query || 'all companies'.includes(query)) {
    const li = document.createElement('li');
    li.className = 'company-item all-companies-item';
    if (state.selectedCompany === 'all-companies') {
      li.classList.add('selected');
    }
    li.innerHTML = `
      <div class="company-item-details">
        <div class="company-item-avatar all-companies-avatar">
          <i data-lucide="globe"></i>
        </div>
        <span class="company-item-name" style="font-weight: 600;">All Companies</span>
      </div>
      <span class="company-item-count">3358</span>
    `;
    li.addEventListener('click', () => selectAllCompanies());
    elements.companyList.appendChild(li);
  }

  if (sorted.length === 0 && (!query || !'all companies'.includes(query))) {
    elements.companyList.innerHTML += `
      <div class="loading-state">
        <i data-lucide="search"></i>
        <p>No companies found</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  sorted.forEach(company => {
    const li = document.createElement('li');
    li.className = 'company-item';
    if (state.selectedCompany && state.selectedCompany.id === company.id) {
      li.classList.add('selected');
    }
    
    // Compute total questions
    const qCount = company.files.all || Object.values(company.files)[0] || 0;
    const initial = company.name.charAt(0).toUpperCase();

    li.innerHTML = `
      <div class="company-item-details">
        <div class="company-item-avatar">${initial}</div>
        <span class="company-item-name" title="${company.name}">${company.name}</span>
      </div>
      <span class="company-item-count">${qCount}</span>
    `;

    li.addEventListener('click', () => selectCompany(company));
    elements.companyList.appendChild(li);
  });

  lucide.createIcons();
}

// Select a company
function selectCompany(company) {
  state.selectedCompany = company;
  
  // Highlight active company item in list
  renderCompanyList();

  // Show dashboard, hide empty state
  elements.emptyState.style.display = 'none';
  elements.dashboardView.style.display = 'flex';

  // Update profile
  elements.companyName.textContent = company.name;
  elements.companyAvatar.textContent = company.name.charAt(0).toUpperCase();
  elements.companyAvatar.className = "company-avatar";
  elements.companyPath.textContent = `leetcode-companywise/${company.id}`;

  // Reset timeframe selector visibility
  elements.timeframeTabs.style.display = 'flex';

  // Update dynamic headers
  updateTableHeaders();

  // Configure timeframe tabs dynamically based on which files exist
  const files = company.files;
  const tabButtons = elements.timeframeTabs.querySelectorAll('.tab-btn');
  
  let firstAvailable = null;
  tabButtons.forEach(btn => {
    const tf = btn.getAttribute('data-timeframe');
    if (files[tf] !== undefined) {
      btn.disabled = false;
      btn.style.display = 'inline-block';
      // Append count badge to tab name
      btn.innerHTML = `${formatTimeframeName(tf)} <span style="font-size: 0.7rem; opacity: 0.6; margin-left: 4px;">(${files[tf]})</span>`;
      
      if (!firstAvailable) {
        firstAvailable = tf;
      }
    } else {
      btn.disabled = true;
      btn.style.display = 'none';
    }
  });

  // Pick timeframe: prefer 'all' if exists, otherwise 'thirty-days', otherwise first available
  let preferred = 'all';
  if (files['all'] !== undefined) {
    preferred = 'all';
  } else if (files['thirty-days'] !== undefined) {
    preferred = 'thirty-days';
  } else {
    preferred = firstAvailable;
  }

  // Activate tab
  tabButtons.forEach(btn => {
    if (btn.getAttribute('data-timeframe') === preferred) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  state.selectedTimeframe = preferred;
  state.currentPage = 1;
  
  // Clear search and filter when changing companies
  elements.questionSearch.value = '';
  elements.difficultyFilter.value = 'all';
  if (elements.tagFilter) elements.tagFilter.value = 'all';
  if (elements.statusFilter) elements.statusFilter.value = 'all';
  
  // Reset sort column to frequency for regular company
  state.sortColumn = 'frequency';
  state.sortDirection = 'desc';
  updateSortHeaders();
  
  // Fetch questions data
  fetchQuestions(company.id, preferred);
}

// Select All Companies aggregated view
async function selectAllCompanies() {
  state.selectedCompany = 'all-companies';
  
  // Highlight active company item in list
  renderCompanyList();

  // Show dashboard, hide empty state
  elements.emptyState.style.display = 'none';
  elements.dashboardView.style.display = 'flex';

  // Update profile
  elements.companyName.textContent = "All Companies";
  elements.companyAvatar.innerHTML = `<i data-lucide="globe"></i>`;
  elements.companyAvatar.className = "company-avatar all-companies-avatar";
  elements.companyPath.textContent = `leetcode-companywise/all-companies`;

  // Hide timeframe selector tabs
  elements.timeframeTabs.style.display = 'none';

  state.selectedTimeframe = 'all';
  state.currentPage = 1;
  
  // Clear search and filter
  elements.questionSearch.value = '';
  elements.difficultyFilter.value = 'all';
  if (elements.tagFilter) elements.tagFilter.value = 'all';
  if (elements.statusFilter) elements.statusFilter.value = 'all';
  
  // Sort by frequency (weighted_frequency) desc by default
  state.sortColumn = 'frequency';
  state.sortDirection = 'desc';

  // Toggle table headers
  updateTableHeaders();

  // Load from cache or fetch
  if (state.aggregatedQuestions) {
    state.questions = state.aggregatedQuestions;
    calculateDashboardStats();
    applyFiltersAndSort();
  } else {
    await fetchAggregatedQuestions();
  }
}

// Fetch Aggregated Questions JSON
async function fetchAggregatedQuestions() {
  elements.tableLoading.style.display = 'flex';
  elements.tableEmpty.style.display = 'none';
  elements.tableBody.innerHTML = '';
  
  try {
    const response = await fetch('/all_companies_aggregated.json');
    if (!response.ok) throw new Error('Failed to load aggregated database.');
    
    const rawData = await response.json();
    state.aggregatedQuestions = rawData.map(q => ({
      ...q,
      tags: state.questionTags[q.id] || []
    }));
    state.questions = state.aggregatedQuestions;
    
    calculateDashboardStats();
    applyFiltersAndSort();
    elements.tableLoading.style.display = 'none';
  } catch (error) {
    console.error(error);
    elements.tableLoading.style.display = 'none';
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--diff-hard); padding: 40px;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <i data-lucide="alert-octagon"></i>
            <span>Error loading aggregated database. Make sure you run in Vite.</span>
          </div>
        </td>
      </tr>
    `;
    lucide.createIcons();
  }
}

// Toggle table headers dynamically based on mode
function updateTableHeaders() {
  const isAll = state.selectedCompany === 'all-companies';
  const thead = elements.questionsTable.querySelector('thead');
  
  if (isAll) {
    thead.innerHTML = `
      <tr>
        <th class="col-solved" style="width: 45px;"></th>
        <th class="sortable col-id" data-col="id">
          <span>ID</span>
          <i data-lucide="chevrons-up-down" class="sort-icon"></i>
        </th>
        <th class="sortable col-title" data-col="title">
          <span>Title</span>
          <i data-lucide="chevrons-up-down" class="sort-icon"></i>
        </th>
        <th class="sortable col-diff" data-col="difficulty">
          <span>Difficulty</span>
          <i data-lucide="chevrons-up-down" class="sort-icon"></i>
        </th>
        <th class="sortable col-accept" data-col="acceptance">
          <span>Acceptance</span>
          <i data-lucide="chevrons-up-down" class="sort-icon"></i>
        </th>
        <th class="sortable col-freq" data-col="frequency" style="width: 170px;">
          <span>Weighted Freq</span>
          <i data-lucide="chevrons-up-down" class="sort-icon"></i>
        </th>
        <th class="col-companies" style="width: 250px;">
          <span>Top Companies</span>
        </th>
      </tr>
    `;
  } else {
    thead.innerHTML = `
      <tr>
        <th class="col-solved" style="width: 45px;"></th>
        <th class="sortable col-id" data-col="id">
          <span>ID</span>
          <i data-lucide="chevrons-up-down" class="sort-icon"></i>
        </th>
        <th class="sortable col-title" data-col="title">
          <span>Title</span>
          <i data-lucide="chevrons-up-down" class="sort-icon"></i>
        </th>
        <th class="sortable col-diff" data-col="difficulty">
          <span>Difficulty</span>
          <i data-lucide="chevrons-up-down" class="sort-icon"></i>
        </th>
        <th class="sortable col-accept" data-col="acceptance">
          <span>Acceptance</span>
          <i data-lucide="chevrons-up-down" class="sort-icon"></i>
        </th>
        <th class="sortable col-freq" data-col="frequency">
          <span>Frequency</span>
          <i data-lucide="chevrons-up-down" class="sort-icon"></i>
        </th>
      </tr>
    `;
  }
  
  // Re-bind click events since the columns are refreshed
  thead.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-col');
      if (state.sortColumn === col) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortColumn = col;
        state.sortDirection = col === 'title' || col === 'id' ? 'asc' : 'desc';
      }
      updateSortHeaders();
      applyFiltersAndSort();
    });
  });
  
  updateSortHeaders();
}

// Find company name helper
function getCompanyName(id) {
  const found = state.companies.find(c => c.id === id);
  return found ? found.name : id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Render company badges in grid rows
function renderCompanyBadges(companies) {
  const top3 = companies.slice(0, 3);
  const remaining = companies.slice(3);
  
  let html = '<div class="companies-cell">';
  
  top3.forEach(c => {
    const cId = c[0];
    const freq = c[1];
    const cName = getCompanyName(cId);
    html += `<a href="#" class="company-badge" onclick="event.preventDefault(); window.navigateToCompany('${cId}')" title="Click to open ${cName} Explorer">${cName} (${freq}%)</a>`;
  });
  
  if (remaining.length > 0) {
    html += `
      <div class="company-tooltip-trigger">
        <span class="company-badge more-badge">+${remaining.length} more</span>
        <div class="company-tooltip">
          <div class="tooltip-title">
            <span>Company</span>
            <span>Freq</span>
          </div>
          <div class="tooltip-list">
            ${companies.map(c => {
              const cId = c[0];
              const cFreq = c[1];
              const name = getCompanyName(cId);
              return `
                <a href="#" class="tooltip-company-item" onclick="event.preventDefault(); window.navigateToCompany('${cId}')">
                  <span class="tooltip-company-name">${name}</span>
                  <span class="tooltip-company-freq">${cFreq}%</span>
                </a>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}

// Register global navigation helper
window.navigateToCompany = function(companyId) {
  const company = state.companies.find(c => c.id === companyId);
  if (company) {
    selectCompany(company);
    // Scroll sidebar to selection
    const items = elements.companyList.querySelectorAll('.company-item');
    items.forEach(item => {
      const nameEl = item.querySelector('.company-item-name');
      if (nameEl && nameEl.textContent === company.name) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }
};

// Translate filename keys to human timeframe names
function formatTimeframeName(key) {
  switch (key) {
    case 'thirty-days': return '30 Days';
    case 'three-months': return '3 Months';
    case 'six-months': return '6 Months';
    case 'more-than-six-months': return 'Older > 6M';
    case 'all': return 'All Time';
    default: return key;
  }
}

// Fetch and Parse CSV File
async function fetchQuestions(companyId, timeframe) {
  elements.tableLoading.style.display = 'flex';
  elements.tableEmpty.style.display = 'none';
  elements.tableBody.innerHTML = '';
  
  try {
    const csvUrl = `/${companyId}/${timeframe}.csv`;
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV data for ${companyId}/${timeframe}`);
    }
    
    const csvText = await response.text();
    
    // Parse CSV
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        processQuestionsData(results.data);
      },
      error: function(err) {
        throw new Error(`CSV parse error: ${err.message}`);
      }
    });
  } catch (error) {
    console.error(error);
    elements.tableLoading.style.display = 'none';
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--diff-hard); padding: 40px;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <i data-lucide="alert-octagon"></i>
            <span>Error loading question records for this timeframe.</span>
          </div>
        </td>
      </tr>
    `;
    lucide.createIcons();
  }
}

// Normalize parsed CSV rows
function processQuestionsData(data) {
  state.questions = data.map(row => {
    // Standard headers: ID, URL, Title, Difficulty, Acceptance %, Frequency %
    const acceptanceRaw = row['Acceptance %'] || '';
    const frequencyRaw = row['Frequency %'] || '';
    const qId = parseInt(row['ID']) || 0;
    
    return {
      id: qId,
      url: row['URL'] || '#',
      title: row['Title'] || 'Untitled',
      difficulty: (row['Difficulty'] || 'Easy').trim(),
      acceptance: parseFloat(acceptanceRaw.replace('%', '')) || 0,
      frequency: parseFloat(frequencyRaw.replace('%', '')) || 0,
      tags: state.questionTags[qId] || []
    };
  });

  calculateDashboardStats();
  applyFiltersAndSort();
  elements.tableLoading.style.display = 'none';
}

// Compute statistics and update dashboard UI
function calculateDashboardStats() {
  const total = state.questions.length;
  elements.statsTotalCount.textContent = total;

  let easyCount = 0;
  let mediumCount = 0;
  let hardCount = 0;
  let totalAcceptance = 0;
  let solvedCount = 0;

  state.questions.forEach(q => {
    const diff = q.difficulty.toLowerCase();
    if (diff === 'easy') easyCount++;
    else if (diff === 'medium') mediumCount++;
    else if (diff === 'hard') hardCount++;
    
    totalAcceptance += q.acceptance;
    
    if (state.solvedQuestionIds.has(q.id)) {
      solvedCount++;
    }
  });

  // Solved count display subtext
  let subtextEl = elements.statsTotalCount.nextElementSibling;
  if (!subtextEl || !subtextEl.classList.contains('card-solved-subtext')) {
    subtextEl = document.createElement('span');
    subtextEl.className = 'card-solved-subtext';
    subtextEl.style.fontSize = '0.75rem';
    subtextEl.style.color = 'var(--text-secondary)';
    subtextEl.style.marginTop = '4px';
    elements.statsTotalCount.parentNode.appendChild(subtextEl);
  }

  if (state.solvedQuestionIds && state.solvedQuestionIds.size > 0) {
    const pct = total > 0 ? ((solvedCount / total) * 100).toFixed(1) : '0.0';
    subtextEl.innerHTML = `<span style="color: var(--diff-easy); font-weight: 600;">${solvedCount}</span> / ${total} Solved (${pct}%)`;
    subtextEl.style.display = 'block';
  } else {
    subtextEl.style.display = 'none';
  }

  const avgAcceptance = total > 0 ? (totalAcceptance / total).toFixed(1) : '0.0';
  elements.statsAvgAcceptance.textContent = `${avgAcceptance}%`;

  // Update difficulty bar percentages
  const easyPct = total > 0 ? (easyCount / total) * 100 : 0;
  const mediumPct = total > 0 ? (mediumCount / total) * 100 : 0;
  const hardPct = total > 0 ? (hardCount / total) * 100 : 0;

  elements.barEasy.style.width = `${easyPct}%`;
  elements.barEasy.setAttribute('title', `Easy: ${easyCount} (${easyPct.toFixed(0)}%)`);
  elements.barMedium.style.width = `${mediumPct}%`;
  elements.barMedium.setAttribute('title', `Medium: ${mediumCount} (${mediumPct.toFixed(0)}%)`);
  elements.barHard.style.width = `${hardPct}%`;
  elements.barHard.setAttribute('title', `Hard: ${hardCount} (${hardPct.toFixed(0)}%)`);

  elements.countEasy.textContent = easyCount;
  elements.countMedium.textContent = mediumCount;
  elements.countHard.textContent = hardCount;
}

// Filter and sort the loaded questions array
function applyFiltersAndSort() {
  const searchQuery = elements.questionSearch.value.trim().toLowerCase();
  const diffFilter = elements.difficultyFilter.value;
  const tagFilter = elements.tagFilter.value;
  const statusFilter = elements.statusFilter ? elements.statusFilter.value : 'all';

  // Filter
  state.filteredQuestions = state.questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery) || q.id.toString().includes(searchQuery);
    const matchesDiff = diffFilter === 'all' || q.difficulty.toLowerCase() === diffFilter;
    const matchesTag = tagFilter === 'all' || (q.tags && q.tags.includes(tagFilter));
    const isSolved = state.solvedQuestionIds.has(q.id);
    const matchesStatus = statusFilter === 'all' ||
                          (statusFilter === 'solved' && isSolved) ||
                          (statusFilter === 'unsolved' && !isSolved);
    return matchesSearch && matchesDiff && matchesTag && matchesStatus;
  });

  // Sort
  const diffRank = { 'easy': 1, 'medium': 2, 'hard': 3 };
  
  state.filteredQuestions.sort((a, b) => {
    let valA, valB;
    
    switch (state.sortColumn) {
      case 'id':
        valA = a.id;
        valB = b.id;
        break;
      case 'title':
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
        break;
      case 'difficulty':
        valA = diffRank[a.difficulty.toLowerCase()] || 0;
        valB = diffRank[b.difficulty.toLowerCase()] || 0;
        break;
      case 'acceptance':
        valA = a.acceptance;
        valB = b.acceptance;
        break;
      case 'frequency':
      default:
        valA = state.selectedCompany === 'all-companies' ? a.weighted_frequency : a.frequency;
        valB = state.selectedCompany === 'all-companies' ? b.weighted_frequency : b.frequency;
        break;
    }

    if (valA < valB) return state.sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return state.sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  state.currentPage = 1;
  renderQuestionsTable();
}

// Render active page of questions into the table
function renderQuestionsTable() {
  const total = state.filteredQuestions.length;
  
  if (total === 0) {
    elements.tableBody.innerHTML = '';
    elements.tableEmpty.style.display = 'flex';
    elements.paginationInfo.textContent = 'Showing 0 to 0 of 0 questions';
    updatePaginationControls();
    return;
  }

  elements.tableEmpty.style.display = 'none';
  
  const startIdx = (state.currentPage - 1) * state.pageSize;
  const endIdx = Math.min(startIdx + state.pageSize, total);
  
  const pageData = state.filteredQuestions.slice(startIdx, endIdx);
  const isAll = state.selectedCompany === 'all-companies';
  
  // Dynamic scale for progress bars in All Companies mode
  const maxVal = isAll ? (Math.max(...state.questions.map(q => q.weighted_frequency)) || 100) : 100;
  
  let html = '';
  pageData.forEach(q => {
    const diffClass = q.difficulty.toLowerCase();
    const freqVal = isAll ? q.weighted_frequency : q.frequency;
    const fillPercent = isAll ? (freqVal / maxVal) * 100 : freqVal;
    const freqText = `${freqVal.toFixed(1)}%`;
    
    // Render tag list under title
    const tagsHtml = q.tags && q.tags.length > 0 
      ? `<div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px;">
           ${q.tags.map(t => `<span class="company-badge" style="font-size: 0.65rem; color: var(--text-muted); background-color: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); padding: 0.5px 5px; border-radius: 4px;">${t}</span>`).join('')}
         </div>`
      : '';

    const isSolved = state.solvedQuestionIds.has(q.id);
    
    html += `
      <tr>
        <td class="col-solved">
          <div class="question-solved-checkbox-container">
            <input type="checkbox" class="question-solved-checkbox" data-id="${q.id}" ${isSolved ? 'checked' : ''} title="Click to toggle solved status">
          </div>
        </td>
        <td class="question-id">${q.id}</td>
        <td>
          <div class="question-title-container">
            <a href="${q.url}" target="_blank" rel="noopener noreferrer" class="question-title-link">
              <span>${q.title}</span>
              <i data-lucide="external-link"></i>
            </a>
          </div>
          ${tagsHtml}
        </td>
        <td>
          <span class="difficulty-pill ${diffClass}">${q.difficulty}</span>
        </td>
        <td style="font-weight: 500;">${q.acceptance.toFixed(1)}%</td>
        <td>
          <div class="frequency-cell">
            <span class="frequency-num" title="${freqText}">${freqText}</span>
            <div class="frequency-track">
              <div class="frequency-fill" style="width: ${fillPercent}%"></div>
            </div>
          </div>
        </td>
        ${isAll ? `<td>${renderCompanyBadges(q.companies)}</td>` : ''}
      </tr>
    `;
  });

  elements.tableBody.innerHTML = html;
  lucide.createIcons();
  
  elements.paginationInfo.textContent = `Showing ${startIdx + 1} to ${endIdx} of ${total} questions`;
  updatePaginationControls();
}

// Render pagination page buttons
function updatePaginationControls() {
  const total = state.filteredQuestions.length;
  const totalPages = Math.ceil(total / state.pageSize);
  
  elements.prevPageBtn.disabled = state.currentPage === 1;
  elements.nextPageBtn.disabled = state.currentPage === totalPages || totalPages === 0;

  elements.pageNumbers.innerHTML = '';
  
  if (totalPages <= 1) return;

  const maxButtons = 5;
  let startPage = Math.max(1, state.currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  // First page button if needed
  if (startPage > 1) {
    addPageButton(1);
    if (startPage > 2) {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'page-ellipsis';
      ellipsis.textContent = '...';
      elements.pageNumbers.appendChild(ellipsis);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    addPageButton(i);
  }

  // Last page button if needed
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'page-ellipsis';
      ellipsis.textContent = '...';
      elements.pageNumbers.appendChild(ellipsis);
    }
    addPageButton(totalPages);
  }
}

function addPageButton(page) {
  const btn = document.createElement('button');
  btn.className = `page-num ${state.currentPage === page ? 'active' : ''}`;
  btn.textContent = page;
  btn.addEventListener('click', () => {
    state.currentPage = page;
    renderQuestionsTable();
    elements.questionsTable.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  elements.pageNumbers.appendChild(btn);
}

// Update table header sorting visual indicators
function updateSortHeaders() {
  const headers = elements.questionsTable.querySelectorAll('th.sortable');
  headers.forEach(th => {
    const col = th.getAttribute('data-col');
    const label = th.querySelector('span').textContent;
    if (col === state.sortColumn) {
      th.classList.add('sorted');
      const iconName = state.sortDirection === 'asc' ? 'chevron-up' : 'chevron-down';
      th.innerHTML = `<span>${label}</span><i data-lucide="${iconName}" class="sort-icon"></i>`;
    } else {
      th.classList.remove('sorted');
      th.innerHTML = `<span>${label}</span><i data-lucide="chevrons-up-down" class="sort-icon"></i>`;
    }
  });
  lucide.createIcons();
}

// Update sorting icons in company list sidebar
function updateSortIcons() {
  const nameIconName = state.companySortKey === 'name'
    ? (state.companySortDir === 'asc' ? 'arrow-up-a-z' : 'arrow-down-z-a')
    : 'arrow-up-a-z';
  const countIconName = state.companySortKey === 'count'
    ? (state.companySortDir === 'desc' ? 'arrow-down-narrow-wide' : 'arrow-up-wide-narrow')
    : 'arrow-down-narrow-wide';

  elements.sortNameBtn.innerHTML = `<span>Name</span><i data-lucide="${nameIconName}"></i>`;
  elements.sortCountBtn.innerHTML = `<span>Questions</span><i data-lucide="${countIconName}"></i>`;
  lucide.createIcons();
}

// Set up UI Event Listeners
function setupEventListeners() {
  // Sidebar Search
  elements.companySearch.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    state.filteredCompanies = state.companies.filter(c => c.name.toLowerCase().includes(query) || c.id.toLowerCase().includes(query));
    elements.clearSearchBtn.style.display = query.length > 0 ? 'flex' : 'none';
    renderCompanyList();
  });

  elements.clearSearchBtn.addEventListener('click', () => {
    elements.companySearch.value = '';
    state.filteredCompanies = [...state.companies];
    elements.clearSearchBtn.style.display = 'none';
    renderCompanyList();
    elements.companySearch.focus();
  });

  // Sidebar sorting
  elements.sortNameBtn.addEventListener('click', () => {
    if (state.companySortKey === 'name') {
      state.companySortDir = state.companySortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.companySortKey = 'name';
      state.companySortDir = 'asc';
      elements.sortNameBtn.classList.add('active');
      elements.sortCountBtn.classList.remove('active');
    }
    updateSortIcons();
    renderCompanyList();
  });

  elements.sortCountBtn.addEventListener('click', () => {
    if (state.companySortKey === 'count') {
      state.companySortDir = state.companySortDir === 'desc' ? 'asc' : 'desc';
    } else {
      state.companySortKey = 'count';
      state.companySortDir = 'desc';
      elements.sortCountBtn.classList.add('active');
      elements.sortNameBtn.classList.remove('active');
    }
    updateSortIcons();
    renderCompanyList();
  });

  // Timeframe Tabs clicks
  elements.timeframeTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn || btn.disabled) return;
    
    // Style tabs
    elements.timeframeTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const tf = btn.getAttribute('data-timeframe');
    state.selectedTimeframe = tf;
    state.currentPage = 1;
    
    fetchQuestions(state.selectedCompany.id, tf);
  });

  // Question search filter
  elements.questionSearch.addEventListener('input', () => {
    applyFiltersAndSort();
  });

  // Question difficulty filter
  elements.difficultyFilter.addEventListener('change', () => {
    applyFiltersAndSort();
  });

  // Question topic tags filter
  elements.tagFilter.addEventListener('change', () => {
    applyFiltersAndSort();
  });

  // Question status filter
  if (elements.statusFilter) {
    elements.statusFilter.addEventListener('change', () => {
      applyFiltersAndSort();
    });
  }

  // Sortable headers clicks
  elements.questionsTable.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-col');
      if (state.sortColumn === col) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortColumn = col;
        state.sortDirection = col === 'title' || col === 'id' ? 'asc' : 'desc';
      }
      updateSortHeaders();
      applyFiltersAndSort();
    });
  });

  // Page Size selector
  elements.pageSize.addEventListener('change', (e) => {
    state.pageSize = parseInt(e.target.value);
    state.currentPage = 1;
    renderQuestionsTable();
  });

  // Solved status checkbox change delegation
  if (elements.tableBody) {
    elements.tableBody.addEventListener('change', (e) => {
      if (e.target && e.target.classList.contains('question-solved-checkbox')) {
        const qId = Number(e.target.getAttribute('data-id'));
        const isChecked = e.target.checked;
        toggleQuestionSolved(qId, isChecked);
      }
    });
  }

  // Prev / Next buttons clicks
  elements.prevPageBtn.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderQuestionsTable();
      elements.questionsTable.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  elements.nextPageBtn.addEventListener('click', () => {
    const total = state.filteredQuestions.length;
    const totalPages = Math.ceil(total / state.pageSize);
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderQuestionsTable();
      elements.questionsTable.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  // --- Solved status Sync modal listeners ---
  if (elements.syncSolvedBtn) {
    elements.syncSolvedBtn.addEventListener('click', () => {
      openSyncModal();
    });
  }

  if (elements.closeModalBtn) {
    elements.closeModalBtn.addEventListener('click', () => {
      closeSyncModal();
    });
  }

  // Close modal when clicking outside modal-container
  if (elements.syncModal) {
    elements.syncModal.addEventListener('click', (e) => {
      if (e.target === elements.syncModal) {
        closeSyncModal();
      }
    });
  }



  // Copy manual console snippet to clipboard
  if (elements.copySnippetBtn) {
    elements.copySnippetBtn.addEventListener('click', async () => {
      const codeSnippet = document.getElementById('manual-console-code');
      if (codeSnippet) {
        try {
          await navigator.clipboard.writeText(codeSnippet.textContent);
          
          // Temporary success UI micro-animation
          const origHTML = elements.copySnippetBtn.innerHTML;
          elements.copySnippetBtn.innerHTML = '<i data-lucide="check" style="stroke: var(--diff-easy); width: 14px; height: 14px;"></i>';
          lucide.createIcons();
          elements.copySnippetBtn.title = 'Copied!';
          
          setTimeout(() => {
            elements.copySnippetBtn.innerHTML = origHTML;
            lucide.createIcons();
            elements.copySnippetBtn.title = 'Copy to clipboard';
          }, 1500);
        } catch (err) {
          console.error('Clipboard write failed:', err);
        }
      }
    });
  }

  // Manual import array submit
  if (elements.manualSyncBtn) {
    elements.manualSyncBtn.addEventListener('click', () => {
      const textVal = elements.manualSolvedIds.value.trim();
      if (!textVal) {
        showSyncStatus('Please paste the JSON array of solved question IDs.', 'error');
        return;
      }

      try {
        const parsed = JSON.parse(textVal);
        if (!Array.isArray(parsed)) {
          throw new Error('Data is not a JSON array (e.g. [1, 2, 3])');
        }

        const idsArray = parsed.map(Number).filter(id => !isNaN(id));
        localStorage.setItem('leetcode_solved_ids', JSON.stringify(idsArray));
        loadSyncedSolvedQuestions();

        // Refresh dashboard view
        calculateDashboardStats();
        applyFiltersAndSort();

        showSyncStatus(`Successfully imported ${idsArray.length} solved questions!`, 'success');
        elements.manualSolvedIds.value = '';

        // Auto close modal after delay
        setTimeout(() => {
          closeSyncModal();
        }, 1500);

      } catch (err) {
        console.error('Manual import error:', err);
        showSyncStatus(`Invalid data: ${err.message}. Format should be: [1, 2, 3]`, 'error');
      }
    });
  }

  // Clear synced data button
  if (elements.clearSyncBtn) {
    elements.clearSyncBtn.addEventListener('click', () => {
      localStorage.removeItem('leetcode_solved_ids');
      loadSyncedSolvedQuestions();

      // Refresh dashboard view
      calculateDashboardStats();
      applyFiltersAndSort();

      showSyncStatus('Cleared all synchronized solved status records.', 'info');
      
      setTimeout(() => {
        closeSyncModal();
      }, 1000);
    });
  }
}

// Boot application
init();
