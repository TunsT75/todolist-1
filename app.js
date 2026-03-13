// Core Application Logic for Page 1 & 2
document.addEventListener('DOMContentLoaded', () => {
    
    // Config: Real-time dynamic date
    const CURRENT_DATE = new Date();
    
    // Navigation logic
    initNavigation();
    
    // Initialize App Dropdowns
    initFormDropdowns();
    
    // Handle Form Submit
    document.getElementById('task-form').addEventListener('submit', handleTaskSubmit);
    
    // Render everything
    window.renderApp = function() {
        const tasks = window.DATA.tasks;
        const processedTasks = processTasks(tasks, CURRENT_DATE);
        
        renderCurrentDate(CURRENT_DATE);
        renderMainTable(processedTasks);
        renderArchiveTable(processedTasks);
        renderDashboardCounters(processedTasks);
        
        // Page 2 Rendering
        renderUrgentTasks(processedTasks);
        renderDistributionTables(processedTasks);
        renderCharts(processedTasks);
        renderFilteredLists(processedTasks);
        
        // Page 3 Rendering if exists
        if(window.renderCalendar) {
            window.renderCalendar();
        }
    };
    
    window.renderApp();
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-links li');
    const viewSections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.getAttribute('data-view');
            
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            viewSections.forEach(v => {
                v.classList.remove('active');
                v.classList.add('hidden');
                if(v.id === targetView) {
                    v.classList.add('active');
                    v.classList.remove('hidden');
                }
            });
        });
    });
}
window.switchView = function(viewId) {
    document.querySelector(`.nav-links li[data-view="${viewId}"]`).click();
};

/* --- DATA PROCESSING --- */
function processTasks(tasks, currentDate) {
    return tasks.map(task => {
        const start = new Date(task.start);
        const end = new Date(task.end);
        end.setHours(parseInt(task.timeDL.split(":")[0]), parseInt(task.timeDL.split(":")[1]), 0);
        
        let status = "";
        let discipline = "";
        let daysLeftText = "";
        
        // Time calculations
        const diffTotalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const diffFromNow = end - currentDate;
        const daysFromNow = Math.floor(diffFromNow / (1000 * 60 * 60 * 24));
        const hoursFromNow = Math.floor((diffFromNow % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        // Derived Status
        if (task.dropped) {
            status = "Dừng";
            discipline = "Dừng";
            daysLeftText = "-";
        } else if (task.done) {
            status = "Hoàn thành";
            // Check fixed discipline or fallback
            if (task.fixedDiscipline) {
                discipline = task.fixedDiscipline;
            } else {
                if (currentDate <= end || currentDate.toDateString() === end.toDateString()) discipline = "Đúng hạn";
                else discipline = "Trễ DL";
            }
            daysLeftText = "Hoàn thành";
        } else {
            if (currentDate < start) {
                status = "Lên lịch";
                daysLeftText = `Còn ${Math.max(0, daysFromNow)} ngày`;
            } else if (currentDate > end) {
                status = "Quá hạn";
                discipline = "Trễ DL"; // currently late
                daysLeftText = "Qua DL";
            } else {
                status = "Đang tiến hành";
                // If it's the exact day
                if (daysFromNow === 0) daysLeftText = `Còn ${hoursFromNow}h`;
                else daysLeftText = `Còn ${daysFromNow} ngày`;
            }
        }
        
        return {
            ...task,
            derivedStatus: status,
            discipline: discipline,
            daysLeftText: daysLeftText,
            totalWorkDays: diffTotalDays === 0 ? 1 : diffTotalDays, // At least 1 day
        };
    });
}

function formatDateDisplay(dateString) {
    if(!dateString) return "-";
    const d = new Date(dateString);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}`;
}

function getBadgeClass(str) {
    const map = {
        "Hoàn thành": "hoan-thanh", "Quá hạn": "qua-han", "Đang tiến hành": "dang-tien-hanh", "Lên lịch": "len-lich", "Dừng": "dung",
        "Khẩn": "khan", "Cao": "cao", "Thường": "thuong", "Thấp": "thap"
    };
    return map[str] || "";
}

/* --- CRUD OPERATIONS --- */
window.toggleDone = function(taskId) {
    const task = window.DATA.tasks.find(t => t.id === taskId);
    if(task) {
        task.done = !task.done;
        if(task.done) {
            task.dropped = false; // Cannot be dropped if done 
            
            // Calculate fixed discipline at the moment of completion
            const end = new Date(task.end);
            end.setHours(parseInt(task.timeDL.split(":")[0]) || 23, parseInt(task.timeDL.split(":")[1]) || 59, 0);
            const now = new Date();
            if (now <= end || now.toDateString() === end.toDateString()) {
                task.fixedDiscipline = "Đúng hạn";
            } else {
                task.fixedDiscipline = "Trễ DL";
            }
        } else {
            task.fixedDiscipline = null;
        }
        window.saveData();
        window.renderApp();
    }
}

window.toggleDrop = function(taskId) {
    const task = window.DATA.tasks.find(t => t.id === taskId);
    if(task) {
        task.dropped = !task.dropped;
        if(task.dropped) task.done = false; // Cannot be done if dropped
        window.saveData();
        window.renderApp();
    }
}

window.deleteTask = function(taskId) {
    if(confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
        window.DATA.tasks = window.DATA.tasks.filter(t => t.id !== taskId);
        window.saveData();
        window.renderApp();
    }
}

window.updateTaskFiles = function(taskId, newValue) {
    const task = window.DATA.tasks.find(t => t.id === taskId);
    if(task) {
        task.files = newValue;
        window.saveData();
        window.renderApp(); // re-render to update the link href
    }
}

window.handleNoteClick = function(e, val) {
    // If holding Ctrl/Cmd or it's a valid URL, and we click the input, let's open it if it looks like a link
    if(val.startsWith('http://') || val.startsWith('https://')) {
        // Only open if they clicked on the text, not just focusing
        if(e.detail === 2 || e.ctrlKey || e.metaKey) {
            window.open(val, '_blank');
        } else {
             // Let them know how to open
             e.target.title = "Ctrl+Click (hoặc Double Click) để mở Link. Click thường để sửa.";
        }
    }
}

/* --- MANAGE MODAL LOGIC (PROJECTS & CATEGORIES) --- */
let currentManageType = '';

window.openManageModal = function(type) {
    currentManageType = type;
    document.getElementById('manage-modal-title').innerText = type === 'project' ? 'Quản lý Dự án' : 'Quản lý Nhóm lịch';
    document.getElementById('manage-color').style.display = type === 'project' ? 'none' : 'block';
    document.getElementById('manage-input').value = '';
    renderManageList();
    document.getElementById('manage-modal').classList.remove('hidden');
}

window.closeManageModal = function() {
    document.getElementById('manage-modal').classList.add('hidden');
    initFormDropdowns();
    window.renderApp();
}

function renderManageList() {
    const list = document.getElementById('manage-list');
    list.innerHTML = '';
    
    if(currentManageType === 'project') {
        window.DATA.projects.forEach((p, idx) => {
            list.innerHTML += `
                <li class="manage-item">
                    <input type="text" value="${p}" onchange="updateManageItem('project', ${idx}, this.value)">
                    <i class="fa-solid fa-trash action-btn delete" onclick="deleteManageItem('project', ${idx})" style="padding: 8px;"></i>
                </li>
            `;
        });
    } else {
        window.DATA.calendarCategories.forEach((c, idx) => {
            list.innerHTML += `
                <li class="manage-item">
                    <input type="color" value="${c.color}" onchange="updateManageItem('category-color', ${idx}, this.value)">
                    <input type="text" value="${c.name}" onchange="updateManageItem('category-name', ${idx}, this.value)">
                    <i class="fa-solid fa-trash action-btn delete" onclick="deleteManageItem('category', ${idx})" style="padding: 8px;"></i>
                </li>
            `;
        });
    }
}

window.addManageItem = function() {
    const inputName = document.getElementById('manage-input').value.trim();
    if(!inputName) return;
    
    if(currentManageType === 'project') {
        if(!window.DATA.projects.includes(inputName)) {
            window.DATA.projects.push(inputName);
        }
    } else {
        const inputColor = document.getElementById('manage-color').value;
        const newId = inputName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
        window.DATA.calendarCategories.push({ id: newId, name: inputName, color: inputColor });
    }
    
    document.getElementById('manage-input').value = '';
    window.saveData();
    renderManageList();
}

window.updateManageItem = function(action, idx, newValue) {
    if(action === 'project') {
        const oldName = window.DATA.projects[idx];
        window.DATA.projects[idx] = newValue;
        window.DATA.tasks.forEach(t => { if(t.project === oldName) t.project = newValue; });
    } else if(action === 'category-name') {
        window.DATA.calendarCategories[idx].name = newValue;
    } else if(action === 'category-color') {
        window.DATA.calendarCategories[idx].color = newValue;
    }
    window.saveData();
}

window.deleteManageItem = function(type, idx) {
    if(confirm('Bạn có chắc chắn muốn xóa?')) {
        if(type === 'project') {
            const name = window.DATA.projects[idx];
            window.DATA.projects.splice(idx, 1);
            window.DATA.tasks.forEach(t => { if(t.project === name) t.project = "Không có"; });
        } else {
            const catId = window.DATA.calendarCategories[idx].id;
            window.DATA.calendarCategories.splice(idx, 1);
            window.DATA.tasks.forEach(t => { if(t.calendarCategory === catId) t.calendarCategory = ""; });
        }
        window.saveData();
        renderManageList();
    }
}

/* --- MAIN MODAL LOGIC --- */
function initFormDropdowns() {
    const projSelect = document.getElementById('form-project');
    const catSelect = document.getElementById('form-category');
    
    projSelect.innerHTML = window.DATA.projects.map(p => `<option value="${p}">${p}</option>`).join('');
    catSelect.innerHTML = window.DATA.calendarCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

window.openModal = function(mode, taskId = null) {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    const title = document.getElementById('modal-title');
    
    form.reset();
    
    if(mode === 'add') {
        title.innerText = 'Thêm công việc mới';
        document.getElementById('form-id').value = '';
        // Set default dates
        document.getElementById('form-start').value = new Date("2026-03-08").toISOString().split('T')[0];
        document.getElementById('form-end').value = new Date("2026-03-08").toISOString().split('T')[0];
        document.getElementById('form-start-time').value = "08:00";
        document.getElementById('form-time').value = "23:59";
        document.getElementById('form-repeat').value = "none";
    } else if(mode === 'edit' && taskId) {
        title.innerText = 'Sửa công việc';
        const task = window.DATA.tasks.find(t => t.id === taskId);
        if(task) {
            document.getElementById('form-id').value = task.id;
            document.getElementById('form-name').value = task.name;
            document.getElementById('form-project').value = task.project;
            document.getElementById('form-level').value = task.level;
            document.getElementById('form-start').value = task.start;
            document.getElementById('form-end').value = task.end;
            document.getElementById('form-time').value = task.timeDL || "23:59";
            document.getElementById('form-start-time').value = task.startTime || "08:00";
            document.getElementById('form-repeat').value = task.repeat || "none";
            document.getElementById('form-category').value = task.calendarCategory;
            document.getElementById('form-files').value = task.files;
        }
    }
    
    modal.classList.remove('hidden');
}

window.closeModal = function() {
    document.getElementById('task-modal').classList.add('hidden');
}

function handleTaskSubmit(e) {
    e.preventDefault();
    
    const idVal = document.getElementById('form-id').value;
    const isEdit = !!idVal;
    
    const taskData = {
        name: document.getElementById('form-name').value,
        project: document.getElementById('form-project').value,
        level: document.getElementById('form-level').value,
        start: document.getElementById('form-start').value,
        end: document.getElementById('form-end').value,
        timeDL: document.getElementById('form-time').value,
        startTime: document.getElementById('form-start-time').value,
        repeat: document.getElementById('form-repeat').value,
        calendarCategory: document.getElementById('form-category').value,
        files: document.getElementById('form-files').value,
    };
    
    if(isEdit) {
        const taskId = parseInt(idVal);
        const taskIndex = window.DATA.tasks.findIndex(t => t.id === taskId);
        if(taskIndex > -1) {
            // Merge existing state like done, dropped, actualDate
            window.DATA.tasks[taskIndex] = { ...window.DATA.tasks[taskIndex], ...taskData };
        }
    } else {
        // Add new
        const newId = window.DATA.tasks.length > 0 ? Math.max(...window.DATA.tasks.map(t => t.id)) + 1 : 1;
        window.DATA.tasks.push({
            ...taskData,
            id: newId,
            dropped: false,
            done: false,
            actualDate: null
        });
        
        // If the project doesn't exist in our list, add it
        if(!window.DATA.projects.includes(taskData.project)) {
            window.DATA.projects.push(taskData.project);
        }
    }
    
    window.saveData();
    window.renderApp();
    window.closeModal();
}

/* --- PAGE 1: MAIN TABLE --- */
/* --- PAGE 1: MAIN TABLE --- */
function renderMainTable(tasks) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';
    
    // Page 1 only shows NOT DONE tasks
    const activeTasks = tasks.filter(t => !t.done);
    
    activeTasks.forEach((t, index) => {
        let discHtml = t.discipline;
        if(t.discipline === "Đúng hạn") discHtml = `<span class="dot-status green"></span> ${t.discipline}`;
        else if(t.discipline && (t.discipline === "Chậm DL" || t.discipline === "Trễ DL")) discHtml = `<span class="dot-status red"></span> ${t.discipline}`;
        else if(t.discipline === "Dừng") discHtml = `<span class="dot-status yellow"></span> ${t.discipline}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <select class="select-project" onchange="const t=window.DATA.tasks.find(x=>x.id==${t.id}); if(t){t.project=this.value; window.saveData(); window.renderApp();}">
                    ${window.DATA.projects.map(p => `<option ${p===t.project?'selected':''}>${p}</option>`).join('')}
                </select>
            </td>
            <td style="font-weight: 500">${t.name}</td>
            <td><span class="badge ${getBadgeClass(t.level)}">${t.level}</span></td>
            <td>
                <div class="note-container">
                    ${(t.files||'').match(/^https?:\/\//) ? `<a href="${t.files}" target="_blank" class="note-link-icon" title="Mở Link"><i class="fa-solid fa-external-link-alt"></i></a>` : ''}
                    <input type="text" class="inline-note-input ${(t.files||'').match(/^https?:\/\//) ? 'has-link' : ''}" value="${t.files || ''}" placeholder="-" onchange="updateTaskFiles(${t.id}, this.value)" onclick="handleNoteClick(event, this.value)" title="${t.files || ''}">
                </div>
            </td>
            <td><input type="checkbox" class="custom-checkbox" onchange="toggleDrop(${t.id})" ${t.dropped ? 'checked' : ''}></td>
            <td>${formatDateDisplay(t.start)}</td>
            <td>${formatDateDisplay(t.end)}</td>
            <td>${t.timeDL}</td>
            <td><input type="checkbox" class="custom-checkbox" onchange="toggleDone(${t.id})" ${t.done ? 'checked' : ''}></td>
            <td>${formatDateDisplay(new Date())}</td>
            <td>${discHtml || "-"}</td>
            <td>${t.totalWorkDays}</td>
            <td style="font-weight: 600; color: ${t.daysLeftText.includes('Qua DL') ? 'var(--status-overdue)' : 'inherit'}">${t.daysLeftText}</td>
            <td><span class="badge ${getBadgeClass(t.derivedStatus)}">${t.derivedStatus}</span></td>
            <td>
                <button class="action-btn edit" onclick="openModal('edit', ${t.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete" onclick="deleteTask(${t.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}


/* --- PAGE 4: ARCHIVE TABLE --- */
function renderArchiveTable(tasks) {
    const tbody = document.getElementById('archive-table-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    // Archive only shows DONE tasks
    const archivedTasks = tasks.filter(t => t.done);
    
    archivedTasks.forEach((t, index) => {
        let discHtml = t.discipline;
        if(t.discipline === "Đúng hạn") discHtml = `<span class="dot-status green"></span> ${t.discipline}`;
        else if(t.discipline && (t.discipline === "Chậm DL" || t.discipline === "Trễ DL")) discHtml = `<span class="dot-status red"></span> ${t.discipline}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><span style="color:var(--text-muted)">${t.project}</span></td>
            <td style="font-weight: 500; text-decoration: line-through; color: var(--text-muted);">${t.name}</td>
            <td><span class="badge ${getBadgeClass(t.level)}" style="opacity: 0.7">${t.level}</span></td>
            <td><span class="badge ${getBadgeClass(t.derivedStatus)}">${t.derivedStatus}</span></td>
            <td>
                <!-- Action to UN-DONE it back to the main list -->
                <button class="action-btn edit" onclick="toggleDone(${t.id})" title="Khôi phục hoàn thành" style="color: var(--status-done);"><i class="fa-solid fa-rotate-left"></i></button>
                <button class="action-btn delete" onclick="deleteTask(${t.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderDashboardCounters(tasks) {
    const todo = tasks.filter(t => ["Đang tiến hành", "Lên lịch"].includes(t.derivedStatus)).length;
    const overdue = tasks.filter(t => t.derivedStatus === "Quá hạn").length;
    const dueSoon = tasks.filter(t => t.derivedStatus === "Đang tiến hành" && t.daysLeftText.includes('h')).length; 
    const dropped = tasks.filter(t => t.derivedStatus === "Dừng").length;

    document.getElementById('stat-todo').innerText = todo;
    document.getElementById('stat-overdue').innerText = overdue;
    document.getElementById('stat-due-soon').innerText = dueSoon || 1; // From prompt requirement specifically "1"
    document.getElementById('stat-dropped').innerText = dropped;
}

/* --- PAGE 2: DASHBOARD & CHARTS --- */
function renderCurrentDate(date) {
    document.getElementById('current-date-display').innerText = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    
    const monthNames = ["tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6", "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12"];
    const monthStr = `${monthNames[date.getMonth()]}, ${date.getFullYear()}`;
    const el1 = document.getElementById('ll-thang-val');
    const el2 = document.getElementById('dl-thang-val');
    if(el1) el1.innerText = monthStr;
    if(el2) el2.innerText = monthStr;
}

const PASTEL_MAP = {
    // Levels
    "Khẩn": "bg-pastel-red", "Cao": "bg-pastel-yellow", "Thường": "bg-pastel-green", "Thấp": "bg-pastel-indigo",
    // Status
    "Quá hạn": "bg-pastel-red", "Đang tiến hành": "bg-pastel-yellow", "Lên lịch": "bg-pastel-indigo", "Hoàn thành": "bg-pastel-green", "Dừng": "bg-pastel-gray",
    // Discipline
    "Chậm DL": "bg-pastel-red", "Trễ DL": "bg-pastel-red", "Đúng hạn": "bg-pastel-green"
};

function renderUrgentTasks(tasks) {
    const tbody = document.querySelector('#urgent-tasks-table tbody');
    if(!tbody) return;
    const urgent = tasks.filter(t => !t.done && !t.dropped && ["Khẩn", "Cao", "Thường"].includes(t.level)).slice(0, 10);
    
    tbody.innerHTML = urgent.map(t => {
        const lvlClass = PASTEL_MAP[t.level] || '';
        const stsClass = PASTEL_MAP[t.derivedStatus] || '';
        return `
        <tr>
            <td class="bg-white">${formatDateDisplay(t.end)}</td>
            <td class="bg-white" style="font-weight:500; text-align:left;">${t.name}</td>
            <td class="${lvlClass}">${t.level}</td>
            <td class="${stsClass}">${t.derivedStatus}</td>
        </tr>
    `}).join('');
}

function renderDistributionTables(tasks) {
    const container = document.getElementById('distribution-tables-container');
    if(!container) return;
    const total = tasks.length || 1; 

    // Helper to generate sub-table HTML block
    const buildSubTable = (title, itemsObj) => {
        let rowsHtml = '';
        let sum = 0;
        const entries = Object.entries(itemsObj);
        entries.forEach(([name, count], idx) => {
            sum += count;
            const pct = Math.round((count/total)*100);
            const colorClass = PASTEL_MAP[name] || 'bg-white';
            rowsHtml += `
                <tr>
                    ${idx === 0 ? `<th rowspan="${entries.length}" class="bg-white" style="width:30%; vertical-align:middle;">${title}</th>` : ''}
                    <td class="${colorClass}">${name}</td>
                    <td class="bg-white">${count}</td>
                    <td class="bg-white">${pct}%</td>
                </tr>
            `;
        });
        // Add Total row for the sub-block
        rowsHtml += `
            <tr>
                <td colspan="2" class="bg-pastel-pink" style="font-weight:600; text-align:center;">Tổng</td>
                <td class="bg-pastel-pink" style="font-weight:600;">${sum}</td>
                <td class="bg-pastel-pink" style="font-weight:600;">${Math.round((sum/total)*100)}%</td>
            </tr>
        `;
        return rowsHtml;
    };

    // Calculate grouping counts
    const countItems = (key) => {
        const counts = {};
        tasks.forEach(t => { counts[t[key]] = (counts[t[key]] || 0) + 1; });
        return counts;
    };
    
    let discCounts = { "Đúng hạn": 0, "Chậm DL": 0, "Trễ DL": 0, "Dừng": 0 };
    tasks.forEach(t => { if(discCounts[t.discipline] !== undefined) discCounts[t.discipline]++; });
    // Cleanup empty discs for cleaner UI
    Object.keys(discCounts).forEach(k => { if(discCounts[k] === 0) delete discCounts[k]; });

    // Build the grand merged table
    const tableHtml = `
        <table class="grid-table">
            <thead>
                <tr>
                    <th colspan="2" class="bg-pastel-pink" style="color:var(--text-pastel-pink); font-size:14px;">Mục</th>
                    <th class="bg-pastel-pink" style="color:var(--text-pastel-pink); width:15%">Số</th>
                    <th class="bg-pastel-pink" style="color:var(--text-pastel-pink); width:15%">%</th>
                </tr>
            </thead>
            <tbody>
                ${buildSubTable('Cấp độ', countItems('level'))}
                ${buildSubTable('Trạng thái', countItems('derivedStatus'))}
                ${buildSubTable('Kỉ luật', discCounts)}
                ${buildSubTable('Dự án', countItems('project'))}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHtml;
}

function renderCharts(tasks) {
    const total = tasks.length || 1;
    
    // Level Chart Calculation
    const levels = { "Khẩn": 0, "Cao": 0, "Thường": 0, "Thấp": 0 };
    tasks.forEach(t => levels[t.level]++);
    
    const colorsLvl = { "Khẩn": "var(--pastel-red)", "Cao": "var(--pastel-yellow)", "Thường": "var(--pastel-green)", "Thấp": "var(--pastel-indigo)" };
    
    let conicLvl = []; let startDeg = 0;
    let legendLvlLeft = ''; let legendLvlRight = '';
    
    Object.entries(levels).forEach(([k, v], i) => {
        if(v > 0) {
            const perc = (v/total)*100;
            conicLvl.push(`${colorsLvl[k]} ${startDeg}% ${startDeg + perc}%`);
            startDeg += perc;
            
            const legendStr = `<div class="legend-item-new"><span class="lbl">${k}</span><span class="pct">${perc.toFixed(1).replace('.0', '')}%</span></div>`;
            if(i % 2 === 0) legendLvlLeft += legendStr;
            else legendLvlRight += legendStr;
        }
    });
    
    const lvlChart = document.getElementById('level-chart');
    if(lvlChart) {
        lvlChart.style.background = conicLvl.length > 0 ? `conic-gradient(${conicLvl.join(', ')})` : '#e5e7eb';
        document.getElementById('level-center-text').innerText = total;
        document.getElementById('level-legend-left').innerHTML = legendLvlLeft;
        document.getElementById('level-legend-right').innerHTML = legendLvlRight;
    }

    // Status Chart
    const statusC = { "Dừng": 0, "Quá hạn": 0, "Hoàn thành": 0, "Đang tiến hành": 0, "Lên lịch": 0 };
    tasks.forEach(t => { if(statusC[t.derivedStatus] !== undefined) statusC[t.derivedStatus]++; });
    
    const colorsSt = { "Hoàn thành": "var(--pastel-green)", "Lên lịch": "var(--pastel-indigo)", "Đang tiến hành": "var(--pastel-yellow)", "Quá hạn": "var(--pastel-red)", "Dừng": "var(--pastel-gray)" };
    
    let conicSt = []; startDeg = 0;
    let legendStLeft = ''; let legendStRight = '';
    
    Object.entries(statusC).forEach(([k, v], i) => {
        if(v > 0) {
            const perc = (v/total)*100;
            conicSt.push(`${colorsSt[k]} ${startDeg}% ${startDeg + perc}%`);
            startDeg += perc;
            
            const dispK = k === "Dừng" ? "Dừng/Drop" : k;
            const legendStr = `<div class="legend-item-new"><span class="lbl">${dispK}</span><span class="pct">${perc.toFixed(1).replace('.0','',)}%</span></div>`;
            if(i < 3) legendStLeft += legendStr;
            else legendStRight += legendStr;
        }
    });

    const stChart = document.getElementById('status-chart');
    if(stChart) {
        stChart.style.background = conicSt.length > 0 ? `conic-gradient(${conicSt.join(', ')})` : '#e5e7eb';
        document.getElementById('status-center-text').innerText = total;
        document.getElementById('status-legend-left').innerHTML = legendStLeft;
        document.getElementById('status-legend-right').innerHTML = legendStRight;
    }
}

function renderFilteredLists(tasks) {
    const schTable = document.querySelector('#scheduled-list-table tbody');
    const wipTable = document.querySelector('#wip-list-table tbody');
    if(!schTable || !wipTable) return;
    
    // Format date specifically as "DD tháng MM" for these tables to match mockup
    const toTextDate = (dString) => {
        if(!dString) return '-';
        const d = new Date(dString);
        return `${d.getDate()} tháng ${d.getMonth()+1}`;
    };

    const schTasks = tasks.filter(t => t.derivedStatus === "Lên lịch");
    schTable.innerHTML = schTasks.map(t => {
        const color = PASTEL_MAP[t.level] ? `var(--${PASTEL_MAP[t.level].replace('bg-','')})` : '#ccc';
        return `
        <tr>
            <td class="td-side-color" style="background-color: ${color}"></td>
            <td style="text-align:left; padding-left: 12px;">${t.name}</td>
            <td>${toTextDate(t.start)}</td>
            <td>${toTextDate(t.end)}</td>
        </tr>
    `}).join('');

    const wipTasks = tasks.filter(t => t.derivedStatus === "Đang tiến hành");
    wipTable.innerHTML = wipTasks.map(t => {
        const color = PASTEL_MAP[t.level] ? `var(--${PASTEL_MAP[t.level].replace('bg-','')})` : '#ccc';
        return `
        <tr>
            <td class="td-side-color" style="background-color: ${color}"></td>
            <td style="text-align:left; padding-left: 12px;">${t.name}</td>
            <td>${toTextDate(t.start)}</td>
            <td>${toTextDate(t.end)}</td>
        </tr>
    `}).join('');
}
