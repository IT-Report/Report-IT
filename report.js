/*************************************************
 * ISSUE REPORT SYSTEM - report.js
 * Version: Fixed
 *************************************************/


/*************************************************
 * GOOGLE APPS SCRIPT API
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


    /*
     * ตรวจสอบ Login
     */

    if (typeof checkLogin === "function") {

        const loginOK = checkLogin();

        if (!loginOK) {
            return;
        }

    }


    /*
     * ตรวจสอบว่ามี Form หรือไม่
     */

    if (!reportForm) {

        console.error(
            "ไม่พบ form id='reportForm'"
        );

        return;
    }


    /*
     * Logout
     */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function () {

                if (typeof logout === "function") {

                    logout();

                } else {

                    sessionStorage.clear();

                    window.location.href =
                        "../index.html";

                }

            }
        );

    }


    /*
     * Submit Form
     */

    reportForm.addEventListener(
        "submit",
        handleReportSubmit
    );


});


/*************************************************
 * HANDLE SUBMIT
 *************************************************/

async function handleReportSubmit(event) {

    event.preventDefault();
    event.stopPropagation();


    const reportForm =
        document.getElementById("reportForm");

    const submitButton =
        document.getElementById(
            "submitReportButton"
        );


    if (!reportForm) {

        showError(
            "ไม่พบแบบฟอร์มแจ้งปัญหา"
        );

        return;
    }


    /*************************************************
     * ตรวจสอบผู้ใช้งาน
     *************************************************/

    let currentUser = null;


    if (
        typeof getCurrentUser === "function"
    ) {

        currentUser =
            getCurrentUser();

    } else {

        currentUser = {

            username:
                sessionStorage.getItem(
                    "username"
                ),

            department:
                sessionStorage.getItem(
                    "department"
                ),

            role:
                sessionStorage.getItem(
                    "role"
                )

        };

    }


    if (
        !currentUser ||
        !currentUser.username
    ) {

        showError(
            "ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่"
        );

        return;
    }


    /*************************************************
     * อ่านข้อมูลจาก Form
     *************************************************/


    const category =
        getValue("category");


    const subject =
        getValue("subject");


    const description =
        getValue("description");


    const location =
        getValue("location");


    const imageInput =
        document.getElementById("image");


    /*************************************************
     * ตรวจสอบข้อมูล
     *************************************************/

    if (!category) {

        showError(
            "กรุณาเลือกประเภทปัญหา"
        );

        focusElement("category");

        return;
    }


    if (!subject) {

        showError(
            "กรุณากรอกหัวข้อปัญหา"
        );

        focusElement("subject");

        return;
    }


    if (!description) {

        showError(
            "กรุณากรอกรายละเอียดปัญหา"
        );

        focusElement("description");

        return;
    }


    /*************************************************
     * ป้องกันกดส่งซ้ำ
     *************************************************/

    if (submitButton) {

        submitButton.disabled = true;

        submitButton.dataset.originalText =
            submitButton.innerHTML;

        submitButton.innerHTML =
            "กำลังส่งข้อมูล...";

    }


    hideMessages();


    try {

        /*************************************************
         * อ่านรูปภาพ
         *************************************************/

        let imageBase64 = "";


        if (
            imageInput &&
            imageInput.files &&
            imageInput.files.length > 0
        ) {

            const imageFile =
                imageInput.files[0];


            /*
             * จำกัด 5 MB
             */

            const maxFileSize =
                5 * 1024 * 1024;


            if (
                imageFile.size >
                maxFileSize
            ) {

                throw new Error(
                    "รูปภาพต้องมีขนาดไม่เกิน 5 MB"
                );

            }


            /*
             * ตรวจสอบประเภทไฟล์
             */

            if (
                !imageFile.type ||
                !imageFile.type.startsWith(
                    "image/"
                )
            ) {

                throw new Error(
                    "กรุณาเลือกไฟล์รูปภาพเท่านั้น"
                );

            }


            imageBase64 =
                await convertFileToBase64(
                    imageFile
                );

        }


        /*************************************************
         * สร้าง Ticket
         *************************************************/

        const ticket =
            createTicketNumber();


        /*************************************************
         * สร้างเวลาแบบประเทศไทย
         *
         * ใช้เวลาจากเครื่องผู้ใช้
         * และไม่ใช้ toISOString()
         * เพราะ toISOString() จะเป็น UTC
         *************************************************/

        const now =
            new Date();


        const dateTime =
            now.getFullYear() +
            "-" +
            String(
                now.getMonth() + 1
            ).padStart(2, "0") +
            "-" +
            String(
                now.getDate()
            ).padStart(2, "0") +
            " " +
            String(
                now.getHours()
            ).padStart(2, "0") +
            ":" +
            String(
                now.getMinutes()
            ).padStart(2, "0") +
            ":" +
            String(
                now.getSeconds()
            ).padStart(2, "0");


        /*************************************************
         * Payload
         *************************************************/

        const payload = {

            action:
                "createIssue",


            ticket:
                ticket,


            dateTime:
                dateTime,


            user:
                currentUser.username ||
                "",


            department:
                department ||
                currentUser.department ||
                "",


            /*
             * ประเภทปัญหา
             */

            category:
                category,


            /*
             * หัวข้อปัญหา
             */

            subject:
                subject,


            /*
             * รายละเอียด
             */

            description:
                description,


            /*
             * สถานที่ / จุดที่พบปัญหา
             */

            location:
                location,


            /*
             * ส่ง location เป็น assetNumber
             * ด้วย เพื่อให้ Apps Script รุ่นปัจจุบัน
             * สามารถบันทึกได้ด้วย
             */

            assetNumber:
                location,


            /*
             * สถานะเริ่มต้น
             */

            status:
                "รอดำเนินการ",


            /*
             * รูปภาพ Base64
             */

            image:
                imageBase64

        };


        console.log(
            "กำลังส่ง Payload:",
            payload
        );


        /*************************************************
         * ส่งไป Google Apps Script
         *************************************************/

        const result =
            await postToGoogleAppsScript(
                payload
            );


        console.log(
            "ผลลัพธ์:",
            result
        );


        /*************************************************
         * ตรวจสอบผลลัพธ์
         *************************************************/

        if (
            result &&
            result.success === true
        ) {

            showSuccess(

                "ส่งแจ้งปัญหาสำเร็จ\n" +
                "เลขที่ Ticket: " +
                ticket

            );


            /*
             * ล้างข้อมูล Form
             */

            reportForm.reset();


            /*
             * ใส่แผนกของ User กลับเข้าไป
             */

            const departmentSelect =
                document.getElementById(
                    "department"
                );


            if (
                departmentSelect &&
                currentUser.department
            ) {

                departmentSelect.value =
                    currentUser.department;

            }


        } else {

            showError(

                result &&
                result.message

                    ? result.message

                    : "ไม่สามารถส่งข้อมูลได้"

            );

        }


    } catch (error) {

        console.error(
            "Submit Error:",
            error
        );


        showError(

            error &&
            error.message

                ? error.message

                : "ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"

        );


    } finally {

        /*
         * เปิดปุ่มกลับ
         */

        if (submitButton) {

            submitButton.disabled =
                false;


            submitButton.innerHTML =
                submitButton.dataset.originalText ||
                "ส่งแจ้งปัญหา";

        }

    }

}


/*************************************************
 * ส่งข้อมูลไป Google Apps Script
 *
 * ใช้ Hidden Iframe
 * เพื่อหลีกเลี่ยง CORS
 *************************************************/

function postToGoogleAppsScript(payload) {

    return new Promise(
        function (resolve, reject) {


            const iframeName =
                "issueReportFrame_" +
                Date.now();


            /*************************************************
             * สร้าง Iframe
             *************************************************/

            const iframe =
                document.createElement(
                    "iframe"
                );


            iframe.name =
                iframeName;


            iframe.id =
                iframeName;


            iframe.style.display =
                "none";


            document.body.appendChild(
                iframe
            );


            /*************************************************
             * สร้าง Form
             *************************************************/

            const form =
                document.createElement(
                    "form"
                );


            form.method =
                "POST";


            form.action =
                API_URL;


            form.target =
                iframeName;


            form.style.display =
                "none";


            /*************************************************
             * สร้าง Payload Input
             *************************************************/

            const input =
                document.createElement(
                    "input"
                );


            input.type =
                "hidden";


            input.name =
                "payload";


            input.value =
                JSON.stringify(
                    payload
                );


            form.appendChild(
                input
            );


            document.body.appendChild(
                form
            );


            let completed =
                false;


            let timeoutId =
                null;


            /*************************************************
             * Cleanup
             *************************************************/

            function cleanup() {

                if (timeoutId) {

                    clearTimeout(
                        timeoutId
                    );

                }


                setTimeout(
                    function () {

                        if (
                            form &&
                            form.parentNode
                        ) {

                            form.parentNode.removeChild(
                                form
                            );

                        }


                        if (
                            iframe &&
                            iframe.parentNode
                        ) {

                            iframe.parentNode.removeChild(
                                iframe
                            );

                        }

                    },
                    500
                );

            }


            /*************************************************
             * สำเร็จ
             *************************************************/

            function completeSuccess() {

                if (completed) {
                    return;
                }


                completed =
                    true;


                cleanup();


                resolve({

                    success:
                        true,

                    message:
                        "ส่งข้อมูลสำเร็จ"

                });

            }


            /*************************************************
             * Error
             *************************************************/

            function completeError(
                message
            ) {

                if (completed) {
                    return;
                }


                completed =
                    true;


                cleanup();


                reject(
                    new Error(
                        message
                    )
                );

            }


            /*************************************************
             * เมื่อ Iframe โหลดเสร็จ
             *************************************************/

            iframe.addEventListener(
                "load",
                function () {

                    /*
                     * Apps Script รับข้อมูลแล้ว
                     * ให้เวลาระบบบันทึก Sheet
                     */

                    setTimeout(
                        function () {

                            completeSuccess();

                        },
                        1000
                    );

                }
            );


            /*************************************************
             * Timeout
             *************************************************/

            timeoutId =
                setTimeout(
                    function () {

                        completeError(

                            "หมดเวลารอ Google Apps Script " +
                            "กรุณาตรวจสอบ Apps Script และการ Deploy"

                        );

                    },
                    30000
                );


            /*************************************************
             * Submit
             *************************************************/

            try {

                form.submit();

            } catch (error) {

                completeError(
                    "ไม่สามารถส่งข้อมูลไปยัง Google Apps Script ได้"
                );

            }

        }
    );

}


/*************************************************
 * แปลงรูปภาพเป็น Base64
 *************************************************/

function convertFileToBase64(file) {

    return new Promise(
        function (resolve, reject) {

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
                            "อ่านรูปภาพไม่สำเร็จ"
                        )
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/*************************************************
 * สร้าง Ticket Number
 *************************************************/

function createTicketNumber() {

    const now =
        new Date();


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
        document.getElementById(
            id
        );


    if (!element) {

        return "";

    }


    return (
        element.value ||
        ""
    ).trim();

}


/*************************************************
 * Focus
 *************************************************/

function focusElement(id) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.focus();

    }

}


/*************************************************
 * แสดง Success
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

        errorMessage.hidden =
            true;

    }


    if (successMessage) {

        successMessage.textContent =
            message;


        successMessage.hidden =
            false;


        successMessage.scrollIntoView({

            behavior:
                "smooth",

            block:
                "center"

        });

    } else {

        alert(message);

    }

}


/*************************************************
 * แสดง Error
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

        successMessage.hidden =
            true;

    }


    if (errorMessage) {

        errorMessage.textContent =
            message;


        errorMessage.hidden =
            false;


        errorMessage.scrollIntoView({

            behavior:
                "smooth",

            block:
                "center"

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

        successMessage.hidden =
            true;

    }


    if (errorMessage) {

        errorMessage.hidden =
            true;

    }

}
