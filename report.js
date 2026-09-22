/*************************************************
 * ISSUE REPORT SYSTEM - report.js
 *************************************************/

const API_URL =
    "https://script.google.com/macros/s/AKfycbw4tzbbumpOpqtPD9e1TUBgRi9EX6-c4nWPIBIyK2vlJdLsdfLRrMC7N0rUiK5fnFpf/exec";


/*************************************************
 * เมื่อหน้าเว็บโหลดเสร็จ
 *************************************************/

document.addEventListener("DOMContentLoaded", function () {

    const reportForm =
        document.getElementById("reportForm");

    const logoutButton =
        document.getElementById("logoutButton");

    const resetButton =
        document.getElementById("resetButton");


    /*
     * ตรวจสอบ Login
     */
    if (typeof checkLogin === "function") {
        checkLogin();
    }


    /*
     * ตรวจสอบ Form
     */
    if (!reportForm) {
        console.error("ไม่พบ element id='reportForm'");
        return;
    }


    /*
     * ปุ่มออกจากระบบ
     */
    if (logoutButton) {

        logoutButton.addEventListener("click", function () {

            if (typeof logout === "function") {
                logout();
            } else {
                sessionStorage.clear();
                window.location.href = "../index.html";
            }

        });

    }


    /*
     * ปุ่มล้างข้อมูล
     */
    if (resetButton) {

        resetButton.addEventListener("click", function () {

            reportForm.reset();
            hideMessages();

        });

    }


    /*
     * เมื่อกดส่ง Form
     */
    reportForm.addEventListener(
        "submit",
        handleReportSubmit
    );

});


/*************************************************
 * จัดการการส่งข้อมูล
 *************************************************/

async function handleReportSubmit(event) {

    event.preventDefault();
    event.stopPropagation();


    const reportForm =
        document.getElementById("reportForm");

    const submitButton =
        document.getElementById("submitButton");


    if (!reportForm) {
        showError("ไม่พบแบบฟอร์มแจ้งปัญหา");
        return;
    }


    /*
     * ตรวจสอบผู้ใช้งาน
     */
    let currentUser = null;

    if (typeof getCurrentUser === "function") {
        currentUser = getCurrentUser();
    }


    if (!currentUser) {

        showError(
            "ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่"
        );

        return;
    }


    /*
     * อ่านค่าจาก Form
     */
    
    const category =
        getValue("category");

    const description =
        getValue("description");

    const assetNumber =
        getValue("assetNumber");

    const imageInput =
        document.getElementById("image");


    /*
     * ตรวจสอบข้อมูลที่จำเป็น
     */
    
    if (!category) {

        showError("กรุณาเลือกประเภทปัญหา");
        focusElement("category");

        return;
    }


    if (!description) {

        showError("กรุณากรอกรายละเอียดปัญหา");
        focusElement("description");

        return;
    }
    
    /*
     * อ่านรูปภาพ
     */
    let imageBase64 = "";

    if (
        imageInput &&
        imageInput.files &&
        imageInput.files.length > 0
    ) {

        const imageFile =
            imageInput.files[0];


        /*
         * จำกัดขนาดไฟล์ไม่เกิน 5 MB
         */
        const maxFileSize =
            5 * 1024 * 1024;


        if (imageFile.size > maxFileSize) {

            showError(
                "รูปภาพต้องมีขนาดไม่เกิน 5 MB"
            );

            return;
        }


        /*
         * ตรวจสอบประเภทไฟล์
         */
        if (
            !imageFile.type ||
            !imageFile.type.startsWith("image/")
        ) {

            showError(
                "กรุณาเลือกไฟล์รูปภาพเท่านั้น"
            );

            return;
        }


        try {

            imageBase64 =
                await convertFileToBase64(
                    imageFile
                );

        } catch (error) {

            console.error(
                "อ่านรูปภาพไม่สำเร็จ:",
                error
            );

            showError(
                "ไม่สามารถอ่านรูปภาพได้"
            );

            return;
        }

    }


    /*
     * สร้าง Ticket
     */
    const ticket =
        createTicketNumber();


    /*
     * สร้าง Payload
     */
    const payload = {

        action: "createIssue",

        ticket: ticket,

        dateTime:
            const now = new Date();

        dateTime:
            new Date().toISOString(),

        user:
            currentUser.username ||
            currentUser.user ||
            "",

        department:
            currentUser.department ||
            "",


        category:
            category,

        description:
            description,


        assetNumber:
            assetNumber,

        status:
            "รอดำเนินการ",

        image:
            imageBase64

    };


    /*
     * ป้องกันกดส่งซ้ำ
     */
    if (submitButton) {

        submitButton.disabled = true;

        submitButton.dataset.originalText =
            submitButton.innerHTML;

        submitButton.innerHTML =
            "กำลังส่งข้อมูล...";

    }


    hideMessages();


    try {

        /*
         * ส่งไป Google Apps Script
         */
        const result =
            await postToGoogleAppsScript(
                payload
            );


        console.log(
            "ผลลัพธ์การส่งข้อมูล:",
            result
        );


        /*
         * ถือว่าส่งสำเร็จเมื่อ Apps Script
         * ตอบกลับผ่าน iframe
         */
        if (
            result &&
            result.success === true
        ) {

            showSuccess(
                "ส่งแจ้งปัญหาสำเร็จ เลขที่ Ticket: " +
                ticket
            );

            reportForm.reset();

        } else {

            showError(
                result && result.message
                    ? result.message
                    : "ไม่สามารถส่งข้อมูลได้"
            );

        }


    } catch (error) {

        console.error(
            "ส่งข้อมูลไม่สำเร็จ:",
            error
        );

        showError(
            error.message ||
            "ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
        );


    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.innerHTML =
                submitButton.dataset.originalText ||
                "ส่งแจ้งปัญหา";

        }

    }

}


/*************************************************
 * ส่งข้อมูลด้วย Hidden Iframe
 *
 * วิธีนี้ใช้ได้กับ Google Apps Script
 * โดยไม่ติดปัญหา CORS แบบ fetch
 *************************************************/

function postToGoogleAppsScript(payload) {

    return new Promise(function (resolve, reject) {

        const iframeName =
            "issueReportFrame_" +
            Date.now() +
            "_" +
            Math.floor(
                Math.random() * 100000
            );


        const iframe =
            document.createElement("iframe");

        iframe.name =
            iframeName;

        iframe.id =
            iframeName;

        iframe.style.display =
            "none";


        document.body.appendChild(
            iframe
        );


        const form =
            document.createElement("form");

        form.method =
            "POST";

        form.action =
            API_URL;

        form.target =
            iframeName;

        form.style.display =
            "none";


        const input =
            document.createElement("input");

        input.type =
            "hidden";

        input.name =
            "payload";

        input.value =
            JSON.stringify(payload);


        form.appendChild(
            input
        );

        document.body.appendChild(
            form
        );


        let completed =
            false;


        let timeoutId;


        function cleanup() {

            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            setTimeout(function () {

                if (form.parentNode) {
                    form.parentNode.removeChild(form);
                }

                if (iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }

            }, 500);

        }


        function completeSuccess() {

            if (completed) {
                return;
            }

            completed =
                true;

            cleanup();


            resolve({

                success: true,

                message:
                    "ส่งข้อมูลไปยัง Google Apps Script แล้ว"

            });

        }


        function completeError(message) {

            if (completed) {
                return;
            }

            completed =
                true;

            cleanup();


            reject(
                new Error(message)
            );

        }


        /*
         * เมื่อ Apps Script ตอบกลับ
         */
        iframe.addEventListener(
            "load",
            function () {

                /*
                 * รอเล็กน้อยเพื่อให้ Apps Script
                 * บันทึกข้อมูลลง Google Sheet เสร็จ
                 */
                setTimeout(function () {

                    completeSuccess();

                }, 1200);

            },
            {
                once: true
            }
        );


        /*
         * ป้องกันค้างไม่สิ้นสุด
         */
        timeoutId =
            setTimeout(function () {

                completeError(
                    "หมดเวลารอการตอบกลับจาก Google Apps Script"
                );

            }, 30000);


        /*
         * เริ่มส่งข้อมูล
         */
        try {

            form.submit();

        } catch (error) {

            completeError(
                "ไม่สามารถส่งข้อมูลไปยังระบบได้"
            );

        }

    });

}


/*************************************************
 * แปลงไฟล์เป็น Base64
 *************************************************/

function convertFileToBase64(file) {

    return new Promise(function (resolve, reject) {

        const reader =
            new FileReader();


        reader.onload =
            function () {

                resolve(
                    reader.result
                );

            };


        reader.onerror =
            function () {

                reject(
                    new Error(
                        "อ่านไฟล์ไม่สำเร็จ"
                    )
                );

            };


        reader.readAsDataURL(
            file
        );

    });

}


/*************************************************
 * สร้างหมายเลข Ticket
 *************************************************/

function createTicketNumber() {

    const now = new Date();

const dateTime =
    now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0") + " " +
    String(now.getHours()).padStart(2, "0") + ":" +
    String(now.getMinutes()).padStart(2, "0") + ":" +
    String(now.getSeconds()).padStart(2, "0");


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    const hours =
        String(
            now.getHours()
        ).padStart(
            2,
            "0"
        );


    const minutes =
        String(
            now.getMinutes()
        ).padStart(
            2,
            "0"
        );


    const seconds =
        String(
            now.getSeconds()
        ).padStart(
            2,
            "0"
        );


    const random =
        Math.floor(
            Math.random() * 900
        ) + 100;


    return (
        "IT-" +
        year +
        month +
        day +
        "-" +
        hours +
        minutes +
        seconds +
        "-" +
        random
    );

}


/*************************************************
 * อ่านค่าจาก Element
 *************************************************/

function getValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {
        return "";
    }


    return element.value.trim();

}


/*************************************************
 * Focus Element
 *************************************************/

function focusElement(id) {

    const element =
        document.getElementById(id);


    if (element) {
        element.focus();
    }

}


/*************************************************
 * แสดงข้อความสำเร็จ
 *************************************************/

function showSuccess(message) {

    const successMessage =
        document.getElementById(
            "successMessage"
        );

    const errorMessage =
        document.getElementById(
            "errorMessage"
        );


    if (errorMessage) {
        errorMessage.hidden = true;
    }


    if (successMessage) {

        successMessage.textContent =
            message;

        successMessage.hidden =
            false;

        successMessage.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    } else {

        alert(message);

    }

}


/*************************************************
 * แสดงข้อความผิดพลาด
 *************************************************/

function showError(message) {

    const successMessage =
        document.getElementById(
            "successMessage"
        );

    const errorMessage =
        document.getElementById(
            "errorMessage"
        );


    if (successMessage) {
        successMessage.hidden = true;
    }


    if (errorMessage) {

        errorMessage.textContent =
            message;

        errorMessage.hidden =
            false;

        errorMessage.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    } else {

        alert(message);

    }

}


/*************************************************
 * ซ่อนข้อความ
 *************************************************/

function hideMessages() {

    const successMessage =
        document.getElementById(
            "successMessage"
        );

    const errorMessage =
        document.getElementById(
            "errorMessage"
        );


    if (successMessage) {
        successMessage.hidden = true;
    }


    if (errorMessage) {
        errorMessage.hidden = true;
    }

}
