
/*************************************************
 * LOGIN SYSTEM
 * Issue Report System
 * GitHub Pages Compatible
 *************************************************/

"use strict";

/*************************************************
 * DEPARTMENT ACCOUNTS
 *************************************************/

const departmentAccounts = {
    GAD:  { password: "KftcGad", department: "GAD", role: "employee" },
    QCD:  { password: "KftcQcd", department: "QCD", role: "employee" },
    ACD:  { password: "KftcAcd", department: "ACD", role: "employee" },
    MKD:  { password: "KftcMkd", department: "MKD", role: "employee" },
    PSD:  { password: "KftcPsd", department: "PSD", role: "employee" },
    PED:  { password: "KftcPed", department: "PED", role: "employee" },
    PDD:  { password: "KftcPdd", department: "PDD", role: "employee" },
    PCS:  { password: "KftcPcs", department: "PCS", role: "employee" },
    PCD:  { password: "KftcPcd", department: "PCD", role: "employee" },
    PRD:  { password: "KftcPrd", department: "PRD", role: "employee" },

    ADMIN: {
        password: "Admin12345678",
        department: "IT",
        role: "admin"
    }
};


/*************************************************
 * LOGIN FORM
 *************************************************/

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");

    // ไม่ทำงานหากหน้านี้ไม่มีฟอร์ม Login
    if (!loginForm) {
        return;
    }

    // ป้องกันการผูก Event ซ้ำ
    if (loginForm.dataset.loginInitialized === "true") {
        return;
    }

    loginForm.dataset.loginInitialized = "true";

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");

        // ตรวจสอบว่ามีช่องกรอกข้อมูลครบ
        if (!usernameInput || !passwordInput) {
            console.error(
                "Login error: ไม่พบช่อง username หรือ password"
            );

            alert("เกิดข้อผิดพลาดในหน้า Login กรุณาตรวจสอบ HTML");
            return;
        }

        const username = usernameInput.value.trim().toUpperCase();
        const password = passwordInput.value;

        // ตรวจสอบ Username
        if (!username) {
            alert("กรุณากรอก Username");
            usernameInput.focus();
            return;
        }

        // ตรวจสอบ Password
        if (!password) {
            alert("กรุณากรอก Password");
            passwordInput.focus();
            return;
        }

        // ตรวจสอบบัญชี
        const account = departmentAccounts[username];

        if (!account || password !== account.password) {
            alert("Username หรือ Password ไม่ถูกต้อง");
            passwordInput.focus();
            passwordInput.select();
            return;
        }

        /*****************************************
         * SAVE SESSION
         *****************************************/

        try {
            sessionStorage.setItem("isLoggedIn", "true");
sessionStorage.setItem("username", username);
sessionStorage.setItem("department", "IT");
sessionStorage.setItem("role", "admin");

        } catch (error) {
            console.error("Unable to save login session:", error);

            alert(
                "ไม่สามารถบันทึกสถานะเข้าสู่ระบบได้ " +
                "กรุณาตรวจสอบการตั้งค่าเบราว์เซอร์"
            );

            return;
        }

        /*****************************************
         * REDIRECT FOR GITHUB PAGES
         *****************************************/

        /*
         * รองรับ URL เช่น
         * https://username.github.io/Issue-Report-System/
         * https://username.github.io/Issue-Report-System/index.html
         *
         * โดยสมมติว่า index.html อยู่ในโฟลเดอร์หลัก
         * ของเว็บไซต์ที่เผยแพร่
         */

        let currentPath = window.location.pathname;

        // กรณีเปิด index.html โดยตรง
        if (currentPath.endsWith("/index.html")) {
            currentPath = currentPath.slice(
                0,
                -"index.html".length
            );
        }

        // กรณี URL ไม่มี / ต่อท้าย
        if (!currentPath.endsWith("/")) {
            currentPath = currentPath.slice(
                0,
                currentPath.lastIndexOf("/") + 1
            );
        }

        const targetPage = account.role === "admin"
            ? "pages/dashboard.html"
            : "pages/report.html";

        const destination = currentPath + targetPage;

        window.location.assign(destination);
    });
});
