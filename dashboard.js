/*************************************************
 * ADMIN DASHBOARD (ปรับปรุงสมบูรณ์)
 *************************************************/

const API_URL =
    "https://script.google.com/macros/s/AKfycbw4tzbbumpOpqtPD9e1TUBgRi9EX6-c4nWPIBIyK2vlJdLsdfLRrMC7N0rUiK5fnFpf/exec";

let allIssues = [];

/*************************************************
 * เริ่มต้น Dashboard
 *************************************************/
document.addEventListener("DOMContentLoaded", function () {
    if (typeof checkAdmin === "function") {
        if (!checkAdmin()) {
            return;
        }
    }
    setupAdminInfo();
    setupEvents();
    loadIssues();
});

/*************************************************
 * แสดงชื่อ Admin
 *************************************************/
function setupAdminInfo() {
    const adminUsername = document.getElementById("adminUsername");
    const user = getCurrentUser();
    if (adminUsername && user) {
        adminUsername.textContent = user.username;
    }
}

/*************************************************
 * ผูกปุ่มและตัวกรอง
 *************************************************/
function setupEvents() {
    const logoutButton = document.getElementById("logoutButton");
    const refreshButton = document.getElementById("refreshButton");
    const statusFilter = document.getElementById("statusFilter");
    const departmentFilter = document.getElementById("departmentFilter");
    const searchInput = document.getElementById("searchInput");
    const closeModalButton = document.getElementById("closeModalButton");
    const closeDetailButton = document.getElementById("closeDetailButton");
    const issueModal = document.getElementById("issueModal");

    if (logoutButton) logoutButton.addEventListener("click", logout);
    if (refreshButton) refreshButton.addEventListener("click", loadIssues);
    if (statusFilter) statusFilter.addEventListener("change", renderIssues);
    if (departmentFilter) departmentFilter.addEventListener("change", renderIssues);
    if (searchInput) searchInput.addEventListener("input", renderIssues);
    if (closeModalButton) closeModalButton.addEventListener("click", closeModal);
    if (closeDetailButton) closeDetailButton.addEventListener("click", closeModal);

    if (issueModal) {
        issueModal.addEventListener("click", function (event) {
            if (event.target === issueModal) closeModal();
        });
    }
}

/*************************************************
 * โหลดข้อมูลจาก Google Apps Script
 *************************************************/
async function loadIssues() {
    showLoading(true);
    showError(false);

    try {
        const response = await fetch(API_URL + "?action=getIssues&time=" + Date.now(), {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) throw new Error("HTTP Error: " + response.status);

        const result = await response.json();
        if (Array.isArray(result)) {
            allIssues = result;
        } else if (Array.isArray(result.data)) {
            allIssues = result.data;
        } else if (Array.isArray(result.issues)) {
            allIssues = result.issues;
        } else {
            allIssues = [];
        }

        updateSummary();
        renderIssues();
    } catch (error) {
        console.error("โหลดข้อมูลไม่สำเร็จ:", error);
        allIssues = [];
        updateSummary();
        renderIssues();
        showError(true);
    } finally {
        showLoading(false);
    }
}

/*************************************************
 * แสดง Loading / Error
 *************************************************/
function showLoading(show) {
    const loadingMessage = document.getElementById("loadingMessage");
    if (loadingMessage) loadingMessage.hidden = !show;
}
function showError(show) {
    const errorMessage = document.getElementById("errorMessage");
    if (errorMessage) errorMessage.hidden = !show;
}

/*************************************************
 * สรุปจำนวนรายการ
 *************************************************/
function updateSummary() {
    const totalIssues = document.getElementById("totalIssues");
    const pendingIssues = document.getElementById("pendingIssues");
    const progressIssues = document.getElementById("progressIssues");
    const completedIssues = document.getElementById("completedIssues");

    const pendingCount = allIssues.filter(i => getIssueValue(i, "STATUS") === "รอดำเนินการ").length;
    const progressCount = allIssues.filter(i => getIssueValue(i, "STATUS") === "กำลังดำเนินการ").length;
    const completedCount = allIssues.filter(i => getIssueValue(i, "STATUS") === "ดำเนินการแล้ว").length;

    if (totalIssues) totalIssues.textContent = allIssues.length;
    if (pendingIssues) pendingIssues.textContent = pendingCount;
    if (progressIssues) progressIssues.textContent = progressCount;
    if (completedIssues) completedIssues.textContent = completedCount;
}

/*************************************************
 * แสดงรายการในตาราง
 *************************************************/
function renderIssues() {
    const tableBody = document.getElementById("issueTableBody");
    if (!tableBody) return;

    const statusFilter = document.getElementById("statusFilter");
    const departmentFilter = document.getElementById("departmentFilter");
    const searchInput = document.getElementById("searchInput");

    const selectedStatus = statusFilter ? statusFilter.value : "all";
    const selectedDepartment = departmentFilter ? departmentFilter.value : "all";
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const filteredIssues = allIssues.filter(issue => {
        const ticket = getIssueValue(issue, "TICKET");
        const dateTime = getIssueValue(issue, "DATE/TIME");
        const user = getIssueValue(issue, "USER");
        const department = getIssueValue(issue, "DEPARTMENT");
        const subject = getIssueValue(issue, "SUBJECT");
        const description = getIssueValue(issue, "DESCRIPTION");
        const status = getIssueValue(issue, "STATUS");

        const matchesStatus = selectedStatus === "all" || status === selectedStatus;
        const matchesDepartment = selectedDepartment === "all" || department === selectedDepartment;
        const searchText = [ticket, dateTime, user, department, subject, description, status].join(" ").toLowerCase();
        const matchesSearch = keyword === "" || searchText.includes(keyword);

        return matchesStatus && matchesDepartment && matchesSearch;
    });

    tableBody.innerHTML = "";
    const fragment = document.createDocumentFragment();

    if (filteredIssues.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 9;
        cell.className = "empty-message";
        cell.textContent = "ไม่พบรายการแจ้งปัญหา";
        row.appendChild(cell);
        fragment.appendChild(row);
    } else {
        filteredIssues.forEach(issue => {
            const row = document.createElement("tr");
            addCell(row, getIssueValue(issue, "TICKET"));
            addCell(row, formatDate(getIssueValue(issue, "DATE/TIME")));
            addCell(row, getIssueValue(issue, "USER"));
            addCell(row, getIssueValue(issue, "DEPARTMENT"));
            addCell(row, getIssueValue(issue, "SUBJECT"));
            addCell(row, getIssueValue(issue, "DESCRIPTION"));

            const statusCell = document.createElement("td");
            statusCell.appendChild(createStatusBadge(getIssueValue(issue, "STATUS")));
            row.appendChild(statusCell);

            const imageCell = document.createElement("td");
            const image = getIssueValue(issue, "IMAGE");
            if (image) {
                const imageLink = document.createElement("a");
                imageLink.href = image;
                imageLink.target = "_blank";
                imageLink.rel = "noopener noreferrer";
                imageLink.textContent = "ดูรูปภาพ";
                imageCell.appendChild(imageLink);
            } else {
                imageCell.textContent = "-";
            }
            row.appendChild(imageCell);

            const actionCell = document.createElement("td");
            const detailButton = document.createElement("button");
            detailButton.type = "button";
            detailButton.textContent = "รายละเอียด";
            detailButton.className = "detail-button";
            detailButton.addEventListener("click", () => openIssueDetail(issue));
            actionCell.appendChild(detailButton);
            row.appendChild(actionCell);

            fragment.appendChild(row);
        });
    }
    tableBody.appendChild(fragment);
}

/*************************************************
 * เพิ่ม Cell
 *************************************************/
function addCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value || "-";
    row.appendChild(cell);
}

/*************************************************
 * อ่านค่าจาก Object รองรับหลายชื่อ
 *************************************************/
function getIssueValue(issue, field) {
    const aliases = {
        "TICKET": ["TICKET", "ticket"],
        "DATE/TIME": ["DATE/TIME", "DATE", "dateTime", "datetime"],
        "USER": ["USER", "user", "username"],
        "DEPARTMENT": ["DEPARTMENT", "department", "dept"],
        "SUBJECT": ["SUBJECT", "subject", "title"],
        "DESCRIPTION": ["DESCRIPTION", "description", "detail"],
        "STATUS": ["STATUS", "status"],
        "IMAGE": ["IMAGE", "image", "imageUrl"]
    };
    const keys = aliases[field] || [field];
    for (let key of keys) {
        if (issue[key] !== undefined
