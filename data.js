// Central state and mock data
const MOCK_DATE = new Date("2026-03-08T00:00:00+07:00"); 

const INITIAL_DATA = {
    projects: ["Ra mắt sản phẩm X", "Cuộc thi NCKH", "Tiếng Trung HSK3", "Personal Management", "Freelance Work", "Health & Fitness"],
    
    calendarCategories: [
        { id: "ban_than", name: "Bản thân", color: "#ec4899" }, 
        { id: "du_an_ca_nhan", name: "Dự án cá nhân", color: "#8b5cf6" }, 
        { id: "gia_dinh", name: "Gia đình", color: "#f59e0b" }, 
        { id: "moi_quan_he", name: "Mối quan hệ", color: "#ef4444" }, 
        { id: "hoc_tap", name: "Học tập", color: "#3b82f6" }, 
        { id: "cong_viec", name: "Công việc", color: "#10b981" }, 
        { id: "suc_khoe", name: "Sức khỏe", color: "#14b8a6" } 
    ],

    tasks: [
        {
            id: 1, project: "Ra mắt sản phẩm X", name: "Lên plan Marketing Q2", level: "Khẩn", files: "Plan_v1.docs", dropped: false,
            start: "2026-03-01", end: "2026-03-05", timeDL: "17:00", done: true, actualDate: "2026-03-06", calendarCategory: "cong_viec"
        },
        {
            id: 2, project: "Ra mắt sản phẩm X", name: "Thiết kế Landing Page", level: "Cao", files: "Figma_link", dropped: false,
            start: "2026-03-04", end: "2026-03-09", timeDL: "12:00", done: false, actualDate: null, calendarCategory: "cong_viec"
        },
        {
            id: 3, project: "Cuộc thi NCKH", name: "Viết báo cáo chương 1-3", level: "Khẩn", files: "Draft.docx", dropped: false,
            start: "2026-02-20", end: "2026-03-07", timeDL: "23:59", done: false, actualDate: null, calendarCategory: "hoc_tap"
        },
        {
            id: 4, project: "Tiếng Trung HSK3", name: "Học từ vựng Unit 1-5", level: "Thường", files: "Flashcards", dropped: false,
            start: "2026-03-05", end: "2026-03-10", timeDL: "22:00", done: false, actualDate: null, calendarCategory: "hoc_tap"
        },
        {
            id: 5, project: "Personal Management", name: "Tổng kết W-1", level: "Cao", files: "", dropped: false,
            start: "2026-03-08", end: "2026-03-08", timeDL: "10:00", done: false, actualDate: null, calendarCategory: "ban_than"
        },
        {
            id: 6, project: "Health & Fitness", name: "Tập yoga buổi sáng", level: "Thường", files: "", dropped: false,
            start: "2026-03-08", end: "2026-03-08", timeDL: "08:00", done: true, actualDate: "2026-03-08", calendarCategory: "suc_khoe"
        },
        {
            id: 7, project: "Cuộc thi NCKH", name: "Họp nhóm dự án", level: "Cao", files: "Zoom", dropped: false,
            start: "2026-03-08", end: "2026-03-08", timeDL: "11:30", done: false, actualDate: null, calendarCategory: "du_an_ca_nhan"
        },
        {
            id: 8, project: "Freelance Work", name: "Dạy lớp Sheet Go", level: "Cao", files: "Slides", dropped: false,
            start: "2026-03-08", end: "2026-03-08", timeDL: "15:00", done: false, actualDate: null, calendarCategory: "cong_viec"
        },
        {
            id: 9, project: "Personal Management", name: "Brain Dump Idea TikTok", level: "Khẩn", files: "Notes", dropped: false,
            start: "2026-03-08", end: "2026-03-09", timeDL: "18:00", done: false, actualDate: null, calendarCategory: "du_an_ca_nhan"
        },
        {
            id: 10, project: "Health & Fitness", name: "Chạy bộ", level: "Thường", files: "", dropped: false,
            start: "2026-03-08", end: "2026-03-08", timeDL: "20:00", done: false, actualDate: null, calendarCategory: "suc_khoe"
        },
        {
            id: 11, project: "Tiếng Trung HSK3", name: "Thi thử đề số 1", level: "Cao", files: "PDF", dropped: true,
            start: "2026-03-01", end: "2026-03-03", timeDL: "12:00", done: false, actualDate: null, calendarCategory: "hoc_tap"
        },
        {
            id: 12, project: "Health & Fitness", name: "Skin Care 3 bước", level: "Thấp", files: "", dropped: false,
            start: "2026-03-08", end: "2026-03-08", timeDL: "22:00", done: false, actualDate: null, calendarCategory: "ban_than"
        },
        {
            id: 13, project: "Personal Management", name: "Thăm bố mẹ", level: "Cao", files: "", dropped: false,
            start: "2026-03-08", end: "2026-03-08", timeDL: "21:00", done: false, actualDate: null, calendarCategory: "gia_dinh"
        },
        {
            id: 14, project: "Freelance Work", name: "Thiết kế giao diện", level: "Khẩn", files: "Figma", dropped: false,
            start: "2026-03-10", end: "2026-03-15", timeDL: "17:00", done: false, actualDate: null, calendarCategory: "cong_viec"
        },
        {
            id: 15, project: "Học tập", name: "Khóa học Thiết kế nâng cao", level: "Thường", files: "Udemy", dropped: false,
            start: "2026-03-16", end: "2026-03-20", timeDL: "23:59", done: false, actualDate: null, calendarCategory: "hoc_tap"
        },
        {
            id: 16, project: "Ra mắt sản phẩm X", name: "Meeting dự án (Khách hàng)", level: "Khẩn", files: "Google Meet", dropped: false,
            start: "2026-03-11", end: "2026-03-11", timeDL: "09:00", done: false, actualDate: null, calendarCategory: "cong_viec"
        },
        {
            id: 17, project: "Cuộc thi NCKH", name: "Nộp bản final", level: "Khẩn", files: "Portal", dropped: false,
            start: "2026-03-12", end: "2026-03-12", timeDL: "23:59", done: false, actualDate: null, calendarCategory: "hoc_tap"
        },
        {
            id: 18, project: "Tiếng Trung HSK3", name: "Luyện nghe bài 6-10", level: "Thường", files: "Audio", dropped: false,
            start: "2026-03-15", end: "2026-03-18", timeDL: "20:00", done: false, actualDate: null, calendarCategory: "hoc_tap"
        },
        {
            id: 19, project: "Personal Management", name: "Đọc sách", level: "Thấp", files: "Book", dropped: false,
            start: "2026-03-09", end: "2026-03-09", timeDL: "21:30", done: false, actualDate: null, calendarCategory: "ban_than"
        },
        {
            id: 20, project: "Mối quan hệ", name: "Cafe cuối tuần", level: "Thấp", files: "", dropped: false,
            start: "2026-03-14", end: "2026-03-14", timeDL: "10:00", done: false, actualDate: null, calendarCategory: "moi_quan_he"
        }
    ]
};

// Persistence Logic
function loadData() {
    const stored = localStorage.getItem('checklist_data');
    if (stored) {
        return JSON.parse(stored);
    } else {
        localStorage.setItem('checklist_data', JSON.stringify(INITIAL_DATA));
        return JSON.parse(JSON.stringify(INITIAL_DATA)); // Deep copy to avoid mutating original Ref
    }
}

function persistData(data) {
    localStorage.setItem('checklist_data', JSON.stringify(data));
}

// Expose state globally
window.DATA = loadData();
window.saveData = function() {
    persistData(window.DATA);
};
