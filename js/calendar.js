// Calendar Logic
document.addEventListener('DOMContentLoaded', () => {

    // Make calendar render global so it can be re-triggered when data changes
    window.renderCalendar = function() {
        // ALWAYS use real current date now
        const CURRENT_DATE = new Date();
        renderSidebarCategories();
        renderMiniCalendar(CURRENT_DATE);
        renderTimeAxis();
        renderDaysGrid(CURRENT_DATE);
        renderTimeBlocks(CURRENT_DATE);
    };
    
});

function renderSidebarCategories() {
    const list = document.getElementById('my-calendars-list');
    const categories = window.DATA.calendarCategories;
    
    list.innerHTML = categories.map(c => `
        <li>
            <input type="checkbox" checked id="cat-${c.id}">
            <div class="cat-color" style="background: ${c.color}"></div>
            <label for="cat-${c.id}">${c.name}</label>
        </li>
    `).join('');
    
    // Add Other Calendars
    document.getElementById('other-calendars-list').innerHTML = `
        <li><input type="checkbox" checked> <div class="cat-color" style="border: 2px solid #ccc; background: white"></div> Chu kỳ mặt trăng</li>
        <li><input type="checkbox" checked> <div class="cat-color" style="border: 2px solid #ccc; background: white"></div> Ngày lễ</li>
    `;
}

function renderMiniCalendar(currentDate) {
    const grid = document.getElementById('mini-cal-grid');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
    grid.style.gap = '4px';
    grid.style.textAlign = 'center';
    grid.style.fontSize = '12px';
    grid.style.marginTop = '12px';
    
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    let html = days.map(d => `<div style="color:var(--text-muted)">${d}</div>`).join('');
    
    // Get days in current month
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    
    // Update Header month/year
    const mNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
    document.querySelector('.mini-cal-header span').innerText = `${mNames[month]} ${year}`;
    document.getElementById('cal-week-label').innerText = `${mNames[month]} ${year}`;
    
    // Pad empty days
    for(let i=0; i<firstDayIndex; i++) {
        html += `<div></div>`;
    }
    
    const todayNum = currentDate.getDate();
    for(let i=1; i<=daysInMonth; i++) {
        const isToday = i === todayNum ? 'background: var(--primary-color); color: white; border-radius: 50%; width: 20px; height: 20px; line-height: 20px; margin: 0 auto;' : '';
        html += `<div style="padding: 4px; cursor: pointer;"><div style="${isToday}">${i}</div></div>`;
    }
    grid.innerHTML = html;
}

function renderTimeAxis() {
    const axis = document.getElementById('time-axis');
    let html = '';
    
    // 7 AM to 11 PM
    for(let i=7; i<=23; i++) {
        const ampm = i < 12 ? 'AM' : 'PM';
        const displayHr = i > 12 ? i - 12 : i;
        html += `<div class="time-slot-label">${displayHr} ${ampm}</div>`;
    }
    axis.innerHTML = html;
}

function renderDaysGrid(currentDate) {
    const headers = document.getElementById('days-headers');
    const cols = document.getElementById('days-columns');
    
    const daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    
    // Find the Monday of the current week
    const currentDayOfWeek = currentDate.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    
    const mondayDate = new Date(currentDate);
    mondayDate.setDate(currentDate.getDate() + distanceToMonday);
    
    let headerHtml = '';
    let colsHtml = '';
    
    window.currentWeekDates = []; // store for renderTimeBlocks
    
    for(let i=0; i<7; i++) {
        const d = new Date(mondayDate);
        d.setDate(mondayDate.getDate() + i);
        window.currentWeekDates.push(d);
        
        const isToday = d.toDateString() === currentDate.toDateString();
        const dateNum = d.getDate();
        
        headerHtml += `
            <div class="day-head ${isToday ? 'active-day' : ''}">
                ${daysOfWeek[i]}
                <span class="day-num">${dateNum}</span>
            </div>
        `;
        
        // ID now uses the exact date string for precise plotting
        const dateIdStr = d.toISOString().split('T')[0];
        colsHtml += `<div class="day-col" id="col-day-${dateIdStr}"></div>`;
    }
    
    headers.innerHTML = headerHtml;
    // Keep current time line intact
    const timeLine = document.getElementById('current-time-line');
    cols.innerHTML = colsHtml;
    cols.appendChild(timeLine);
    
    // Position Current Time Line precisely if today is in the current week view
    timeLine.style.display = 'none';
    const todayIndex = window.currentWeekDates.findIndex(d => d.toDateString() === currentDate.toDateString());
    if(todayIndex !== -1) {
        timeLine.style.display = 'block';
        const nowHr = currentDate.getHours();
        const nowMin = currentDate.getMinutes();
        // Constraints: Calendar timeline is 7AM to 11PM. If outside, hide the line.
        if (nowHr >= 7 && nowHr < 24) {
            const offsetHours = (nowHr - 7) + (nowMin / 60);
            timeLine.style.top = `${offsetHours * 60}px`;
        } else {
            timeLine.style.display = 'none';
        }
    }
}

function renderTimeBlocks(currentDate) {
    const tasks = window.DATA.tasks;
    const pxPerHour = 60;
    
    // Clear old blocks first loops through current week dates
    window.currentWeekDates.forEach(d => {
        const dateStr = d.toISOString().split('T')[0];
        const col = document.getElementById(`col-day-${dateStr}`);
        if(col) {
            // Remove everything except current time line
            const timeLine = col.querySelector('.current-time-line');
            col.innerHTML = '';
            if(timeLine) col.appendChild(timeLine);
        }
    });
    
    tasks.forEach(task => {
        // Skip completely dropped tasks on the calendar
        if(task.dropped) return;
        
        // Map category color
        const cat = window.DATA.calendarCategories.find(c => c.id === task.calendarCategory);
        const color = cat ? cat.color : '#ccc';
        
        // Use true start and end bounds based on the task data
        const startBound = new Date(task.start);
        const endBound = new Date(task.end);
        
        // Start time & End Time parsing
        const sParts = (task.startTime || "08:00").split(':');
        let startHr = parseInt(sParts[0]) || 8;
        let startMin = parseInt(sParts[1]) || 0;
        
        const eParts = (task.timeDL || "23:59").split(':');
        let endHr = parseInt(eParts[0]) || 23;
        let endMin = parseInt(eParts[1]) || 59;
        
        // Calculate raw block height
        // Cap at 7 AM visually for calendar constraints
        let visualStartHr = startHr;
        let visualStartMin = startMin;
        if (visualStartHr < 7) { visualStartHr = 7; visualStartMin = 0; }
        
        const offsetStartHr = visualStartHr - 7 + (visualStartMin / 60);
        const topPx = offsetStartHr * pxPerHour;
        
        let visualEndHr = endHr + (endMin/60);
        let heightPx = (visualEndHr - (visualStartHr + visualStartMin/60)) * pxPerHour;
        if(heightPx < 20) heightPx = 20; // Ensure minimum visibility

        // Repetition Logic
        window.currentWeekDates.forEach(d => {
            const dateStr = d.toISOString().split('T')[0];
            
            // Check if this visual date falls within the task's start/end bounds (inclusive)
            const strippedD = new Date(d); strippedD.setHours(0,0,0,0);
            const strippedStart = new Date(startBound); strippedStart.setHours(0,0,0,0);
            const strippedEnd = new Date(endBound); strippedEnd.setHours(0,0,0,0);
            
            if (strippedD >= strippedStart && strippedD <= strippedEnd) {
                let shouldRender = false;
                
                if (task.repeat === 'daily') {
                    shouldRender = true;
                } else if (task.repeat === 'weekly') {
                    if (strippedD.getDay() === strippedStart.getDay()) shouldRender = true;
                } else if (task.repeat === 'monthly') {
                    if (strippedD.getDate() === strippedStart.getDate()) shouldRender = true;
                } else {
                    // none or undefined -> only render on the EXACT start date (or end date if start was missing)
                    if (strippedD.getTime() === strippedStart.getTime()) shouldRender = true;
                }
                
                if (shouldRender) {
                    const col = document.getElementById(`col-day-${dateStr}`);
                    if (col && topPx >= 0 && topPx <= 16 * 60) {
                        const block = document.createElement('div');
                        block.className = 'time-block';
                        block.style.top = `${topPx}px`;
                        block.style.height = `${heightPx}px`;
                        block.style.backgroundColor = color;
                        
                        // Add opacity if task is done
                        if(task.done) block.style.opacity = '0.5';
                        
                        block.innerHTML = `
                            <h4>${task.done ? '✓ ' : ''}${task.name}</h4>
                            <span>${startHr < 10 ? '0'+startHr : startHr}:${startMin < 10 ? '0'+startMin : startMin} - ${endHr < 10 ? '0'+endHr : endHr}:${endMin < 10 ? '0'+endMin : endMin}</span>
                        `;
                        
                        col.appendChild(block);
                    }
                }
            }
        });
    });
}
