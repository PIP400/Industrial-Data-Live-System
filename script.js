// ======================================================
// IDLS - DAILY PRODUCTION REPORT SYSTEM
// ======================================================


// ======================================================
// GLOBAL DATA
// ======================================================

let reports = [];

const STORAGE_KEY = "idls_reports";


// ======================================================
// FORM ELEMENTS
// ======================================================

const reportForm =
    document.getElementById("reportForm");

const reportId =
    document.getElementById("reportId");

const dateInput =
    document.getElementById("date");

const timeInput =
    document.getElementById("time");

const shiftInput =
    document.getElementById("shift");

const totalInput =
    document.getElementById("totalInput");

const ngInput =
    document.getElementById("ng");

const calculatedOutput =
    document.getElementById("calculatedOutput");


// ======================================================
// TABLE ELEMENTS
// ======================================================

const reportsTableBody =
    document.getElementById("reportsTableBody");

const emptyState =
    document.getElementById("emptyState");


// ======================================================
// SEARCH / FILTER
// ======================================================

const searchInput =
    document.getElementById("searchInput");

const filterDate =
    document.getElementById("filterDate");

const filterShift =
    document.getElementById("filterShift");


// ======================================================
// FORM BUTTONS
// ======================================================

const formTitle =
    document.getElementById("formTitle");

const saveButton =
    document.getElementById("saveButton");

const cancelButton =
    document.getElementById("cancelButton");


// ======================================================
// PRODUCTION DATA BUTTONS
// ======================================================

const saveProductionDataButton =
    document.getElementById(
        "saveProductionDataButton"
    );

const uploadProductionDataButton =
    document.getElementById(
        "uploadProductionDataButton"
    );

const refreshProductionDataButton =
    document.getElementById(
        "refreshProductionDataButton"
    );

const productionDataFile =
    document.getElementById(
        "productionDataFile"
    );

const statusBox =
    document.getElementById(
        "statusBox"
    );


// ======================================================
// INITIALIZE
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setDefaultDateTime();

        loadData();

        updateOutput();

        updateClock();

        setInterval(
            updateClock,
            1000
        );

    }
);


// ======================================================
// LOAD DATA
// ======================================================

async function loadData() {

    const savedData =
        localStorage.getItem(
            STORAGE_KEY
        );


    // --------------------------------------------------
    // LOAD BROWSER DATA FIRST
    // --------------------------------------------------

    if (savedData) {

        try {

            reports =
                JSON.parse(
                    savedData
                );


            if (!Array.isArray(reports)) {

                reports = [];

            }


            renderReports();

            updateSummary();

            return;

        }

        catch (error) {

            console.error(
                "Invalid localStorage data:",
                error
            );

        }

    }


    // --------------------------------------------------
    // LOAD INITIAL JSON
    // --------------------------------------------------

    try {

        const response =
            await fetch(
                "idls_data.json"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load idls_data.json"
            );

        }


        const data =
            await response.json();


        reports =
            Array.isArray(
                data.reports
            )
                ? data.reports
                : [];


        saveLocalData();

        renderReports();

        updateSummary();

    }

    catch (error) {

        console.error(
            "Initial JSON load error:",
            error
        );


        reports = [];

        renderReports();

        updateSummary();

    }

}


// ======================================================
// SAVE LOCAL BROWSER DATA
// ======================================================

function saveLocalData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            reports
        )
    );

}


// ======================================================
// CALCULATE OUTPUT
// ======================================================

function calculateOutput(
    input,
    ng
) {

    input =
        Number(input) || 0;

    ng =
        Number(ng) || 0;


    return Math.max(
        input - ng,
        0
    );

}


// ======================================================
// UPDATE OUTPUT PREVIEW
// ======================================================

function updateOutput() {

    const input =
        Number(
            totalInput.value
        ) || 0;


    const ng =
        Number(
            ngInput.value
        ) || 0;


    const output =
        calculateOutput(
            input,
            ng
        );


    calculatedOutput.textContent =
        output.toLocaleString();

}


totalInput.addEventListener(
    "input",
    updateOutput
);


ngInput.addEventListener(
    "input",
    updateOutput
);


// ======================================================
// CREATE / UPDATE REPORT
// ======================================================

reportForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const input =
            Number(
                totalInput.value
            );


        const ng =
            Number(
                ngInput.value
            );


        // --------------------------------------------------
        // VALIDATION
        // --------------------------------------------------

        if (
            input < 0 ||
            ng < 0
        ) {

            alert(
                "Values cannot be negative."
            );

            return;

        }


        if (
            ng > input
        ) {

            alert(
                "NG / Defects cannot be greater than Total Input."
            );

            return;

        }


        const output =
            calculateOutput(
                input,
                ng
            );


        const editingId =
            Number(
                reportId.value
            );


        // --------------------------------------------------
        // UPDATE
        // --------------------------------------------------

        if (editingId) {

            const index =
                reports.findIndex(
                    report =>
                        Number(report.id) ===
                        editingId
                );


            if (index !== -1) {

                reports[index] = {

                    id:
                        editingId,

                    date:
                        dateInput.value,

                    time:
                        timeInput.value,

                    shift:
                        shiftInput.value,

                    totalInput:
                        input,

                    ng:
                        ng,

                    totalOutput:
                        output

                };

            }

        }


        // --------------------------------------------------
        // CREATE
        // --------------------------------------------------

        else {

            const newReport = {

                id:
                    generateId(),

                date:
                    dateInput.value,

                time:
                    timeInput.value,

                shift:
                    shiftInput.value,

                totalInput:
                    input,

                ng:
                    ng,

                totalOutput:
                    output

            };


            reports.push(
                newReport
            );

        }


        // --------------------------------------------------
        // SAVE
        // --------------------------------------------------

        saveLocalData();


        renderReports();

        updateSummary();

        resetForm();

    }
);


// ======================================================
// GENERATE ID
// ======================================================

function generateId() {

    if (
        reports.length === 0
    ) {

        return 1;

    }


    return Math.max(
        ...reports.map(
            report =>
                Number(report.id) || 0
        )
    ) + 1;

}


// ======================================================
// RENDER REPORTS
// ======================================================

function renderReports() {

    reportsTableBody.innerHTML =
        "";


    const filteredReports =
        getFilteredReports();


    if (
        filteredReports.length === 0
    ) {

        emptyState.classList.remove(
            "hidden"
        );

        return;

    }


    emptyState.classList.add(
        "hidden"
    );


    filteredReports
        .slice()
        .sort(
            (a, b) =>
                Number(b.id) -
                Number(a.id)
        )
        .forEach(
            report => {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.className =
                    "border-b hover:bg-slate-50 transition";


                row.innerHTML = `

                    <td class="px-4 py-3 font-medium">
                        ${escapeHTML(report.id)}
                    </td>

                    <td class="px-4 py-3">
                        ${escapeHTML(report.date)}
                    </td>

                    <td class="px-4 py-3">
                        ${escapeHTML(report.time)}
                    </td>

                    <td class="px-4 py-3">

                        <span
                            class="inline-block bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium"
                        >
                            ${escapeHTML(report.shift)}
                        </span>

                    </td>

                    <td class="px-4 py-3 text-right font-medium">
                        ${Number(report.totalInput).toLocaleString()}
                    </td>

                    <td class="px-4 py-3 text-right text-red-600 font-medium">
                        ${Number(report.ng).toLocaleString()}
                    </td>

                    <td class="px-4 py-3 text-right text-green-600 font-bold">
                        ${Number(report.totalOutput).toLocaleString()}
                    </td>

                    <td class="px-4 py-3">

                        <div class="flex justify-center gap-2">

                            <button
                                onclick="editReport(${report.id})"
                                class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-md text-xs font-medium"
                            >
                                Edit
                            </button>

                            <button
                                onclick="deleteReport(${report.id})"
                                class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-medium"
                            >
                                Delete
                            </button>

                        </div>

                    </td>

                `;


                reportsTableBody.appendChild(
                    row
                );

            }
        );

}


// ======================================================
// FILTER REPORTS
// ======================================================

function getFilteredReports() {

    const search =
        searchInput.value
            .toLowerCase()
            .trim();


    const selectedDate =
        filterDate.value;


    const selectedShift =
        filterShift.value;


    return reports.filter(
        report => {

            const matchesSearch =
                !search ||

                String(
                    report.id
                )
                    .toLowerCase()
                    .includes(search) ||

                String(
                    report.date
                )
                    .toLowerCase()
                    .includes(search) ||

                String(
                    report.time
                )
                    .toLowerCase()
                    .includes(search) ||

                String(
                    report.shift
                )
                    .toLowerCase()
                    .includes(search);


            const matchesDate =
                !selectedDate ||
                report.date === selectedDate;


            const matchesShift =
                !selectedShift ||
                report.shift === selectedShift;


            return (
                matchesSearch &&
                matchesDate &&
                matchesShift
            );

        }
    );

}


searchInput.addEventListener(
    "input",
    renderReports
);


filterDate.addEventListener(
    "change",
    renderReports
);


filterShift.addEventListener(
    "change",
    renderReports
);


// ======================================================
// EDIT REPORT
// ======================================================

function editReport(id) {

    const report =
        reports.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!report) {

        return;

    }


    reportId.value =
        report.id;


    dateInput.value =
        report.date;


    timeInput.value =
        report.time;


    shiftInput.value =
        report.shift;


    totalInput.value =
        report.totalInput;


    ngInput.value =
        report.ng;


    updateOutput();


    formTitle.textContent =
        "Edit Production Report";


    saveButton.textContent =
        "Update Report";


    saveButton.classList.remove(
        "bg-blue-600"
    );


    saveButton.classList.add(
        "bg-green-600"
    );


    cancelButton.classList.remove(
        "hidden"
    );


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// ======================================================
// DELETE REPORT
// ======================================================

function deleteReport(id) {

    const report =
        reports.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!report) {

        return;

    }


    const confirmed =
        confirm(
            `Delete report #${report.id}?`
        );


    if (!confirmed) {

        return;

    }


    reports =
        reports.filter(
            item =>
                Number(item.id) !==
                Number(id)
        );


    saveLocalData();

    renderReports();

    updateSummary();

    resetForm();

}


// ======================================================
// CANCEL EDIT
// ======================================================

cancelButton.addEventListener(
    "click",
    resetForm
);


// ======================================================
// RESET FORM
// ======================================================

function resetForm() {

    reportForm.reset();


    reportId.value =
        "";


    formTitle.textContent =
        "Add Production Report";


    saveButton.textContent =
        "Save Report";


    saveButton.classList.remove(
        "bg-green-600"
    );


    saveButton.classList.add(
        "bg-blue-600"
    );


    cancelButton.classList.add(
        "hidden"
    );


    setDefaultDateTime();

    updateOutput();

}


// ======================================================
// DEFAULT DATE / TIME
// ======================================================

function setDefaultDateTime() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        )
        .padStart(
            2,
            "0"
        );


    const hours =
        String(
            now.getHours()
        )
        .padStart(
            2,
            "0"
        );


    const minutes =
        String(
            now.getMinutes()
        )
        .padStart(
            2,
            "0"
        );


    dateInput.value =
        `${year}-${month}-${day}`;


    timeInput.value =
        `${hours}:${minutes}`;


    autoSelectShift(
        now.getHours()
    );

}


// ======================================================
// AUTOMATIC SHIFT
// ======================================================

function autoSelectShift(
    hour
) {

    if (
        hour >= 6 &&
        hour < 14
    ) {

        shiftInput.value =
            "6AM-2PM";

    }

    else if (
        hour >= 14 &&
        hour < 22
    ) {

        shiftInput.value =
            "2PM-10PM";

    }

    else {

        shiftInput.value =
            "10PM-6AM";

    }

}


// ======================================================
// SUMMARY
// ======================================================

function updateSummary() {

    let totalInputValue =
        0;


    let totalNGValue =
        0;


    let totalOutputValue =
        0;


    reports.forEach(
        report => {

            totalInputValue +=
                Number(
                    report.totalInput
                ) || 0;


            totalNGValue +=
                Number(
                    report.ng
                ) || 0;


            totalOutputValue +=
                calculateOutput(
                    report.totalInput,
                    report.ng
                );

        }
    );


    document.getElementById(
        "summaryInput"
    ).textContent =
        totalInputValue.toLocaleString();


    document.getElementById(
        "summaryNG"
    ).textContent =
        totalNGValue.toLocaleString();


    document.getElementById(
        "summaryOutput"
    ).textContent =
        totalOutputValue.toLocaleString();


    document.getElementById(
        "summaryReports"
    ).textContent =
        reports.length.toLocaleString();

}


// ======================================================
// CURRENT DATE / TIME
// ======================================================

function updateClock() {

    const now =
        new Date();


    document.getElementById(
        "currentDateTime"
    ).textContent =
        now.toLocaleString();

}


// ======================================================
// SAVE PRODUCTION DATA
// ======================================================

saveProductionDataButton.addEventListener(
    "click",
    saveProductionData
);


function saveProductionData() {

    /*
        Create the production_data.json
        structure.
    */

    const data = {

        reports:
            reports

    };


    /*
        Convert object to JSON.
    */

    const jsonData =
        JSON.stringify(
            data,
            null,
            4
        );


    /*
        Create downloadable file.
    */

    const blob =
        new Blob(
            [jsonData],
            {
                type:
                    "application/json"
            }
        );


    /*
        Create temporary download URL.
    */

    const url =
        URL.createObjectURL(
            blob
        );


    /*
        Create download link.
    */

    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "production_data.json";


    link.style.display =
        "none";


    document.body.appendChild(
        link
    );


    /*
        Start browser download.
    */

    link.click();


    document.body.removeChild(
        link
    );


    /*
        Remove temporary URL.
    */

    setTimeout(
        () => {

            URL.revokeObjectURL(
                url
            );

        },
        1000
    );


    showStatus(
        "Production data saved successfully. production_data.json has been downloaded.",
        "success"
    );

}


// ======================================================
// UPLOAD PRODUCTION DATA
// ======================================================

uploadProductionDataButton.addEventListener(
    "click",
    () => {

        productionDataFile.click();

    }
);


productionDataFile.addEventListener(
    "change",
    handleProductionDataUpload
);


// ======================================================
// HANDLE UPLOAD
// ======================================================

function handleProductionDataUpload(
    event
) {

    const file =
        event.target.files[0];


    if (!file) {

        return;

    }


    /*
        Only JSON files.
    */

    if (
        !file.name
            .toLowerCase()
            .endsWith(".json")
    ) {

        showStatus(
            "Please select a JSON file.",
            "error"
        );


        productionDataFile.value =
            "";


        return;

    }


    /*
        Read selected file.
    */

    const reader =
        new FileReader();


    reader.onload =
        function (event) {

            try {

                const data =
                    JSON.parse(
                        event.target.result
                    );


                /*
                    Validate structure.
                */

                if (
                    !data ||
                    !Array.isArray(
                        data.reports
                    )
                ) {

                    throw new Error(
                        "Invalid production data format."
                    );

                }


                /*
                    Convert imported
                    reports into the
                    correct structure.
                */

                reports =
                    data.reports.map(
                        (
                            report,
                            index
                        ) => {

                            const input =
                                Number(
                                    report.totalInput
                                ) || 0;


                            const ng =
                                Number(
                                    report.ng
                                ) || 0;


                            return {

                                id:
                                    Number(
                                        report.id
                                    ) ||
                                    index + 1,


                                date:
                                    report.date ||
                                    "",


                                time:
                                    report.time ||
                                    "",


                                shift:
                                    report.shift ||
                                    "",


                                totalInput:
                                    input,


                                ng:
                                    ng,


                                totalOutput:
                                    calculateOutput(
                                        input,
                                        ng
                                    )

                            };

                        }
                    );


                /*
                    Store imported data
                    in browser storage.
                */

                saveLocalData();


                /*
                    Update page immediately.
                */

                renderReports();

                updateSummary();


                showStatus(
                    `${reports.length} production report(s) uploaded successfully. Click Refresh to reload the production reports.`,
                    "success"
                );

            }

            catch (error) {

                console.error(
                    "Upload error:",
                    error
                );


                showStatus(
                    "Unable to upload the file. Make sure it is a valid production_data.json file.",
                    "error"
                );

            }

        };


    reader.onerror =
        function () {

            showStatus(
                "Unable to read the selected file.",
                "error"
            );

        };


    reader.readAsText(
        file
    );


    /*
        Allow the same file to
        be selected again later.
    */

    productionDataFile.value =
        "";

}


// ======================================================
// REFRESH PRODUCTION DATA
// ======================================================

refreshProductionDataButton.addEventListener(
    "click",
    refreshProductionData
);


function refreshProductionData() {

    /*
        Read the latest data
        from localStorage.
    */

    const savedData =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (savedData) {

        try {

            reports =
                JSON.parse(
                    savedData
                );


            if (
                !Array.isArray(
                    reports
                )
            ) {

                reports = [];

            }

        }

        catch (error) {

            console.error(
                "Refresh error:",
                error
            );


            reports = [];

        }

    }

    else {

        reports = [];

    }


    /*
        Re-render everything.
    */

    renderReports();

    updateSummary();

    updateOutput();


    showStatus(
        `Production reports refreshed. ${reports.length} report(s) loaded.`,
        "success"
    );

}


// ======================================================
// STATUS MESSAGE
// ======================================================

function showStatus(
    message,
    type
) {

    if (!statusBox) {

        return;

    }


    statusBox.classList.remove(
        "hidden",
        "bg-green-100",
        "text-green-800",
        "bg-red-100",
        "text-red-800",
        "bg-blue-100",
        "text-blue-800"
    );


    if (
        type === "success"
    ) {

        statusBox.classList.add(
            "bg-green-100",
            "text-green-800"
        );

    }

    else if (
        type === "error"
    ) {

        statusBox.classList.add(
            "bg-red-100",
            "text-red-800"
        );

    }

    else {

        statusBox.classList.add(
            "bg-blue-100",
            "text-blue-800"
        );

    }


    statusBox.textContent =
        message;

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHTML(
    value
) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// ======================================================
// GLOBAL FUNCTIONS
// ======================================================

window.editReport =
    editReport;

window.deleteReport =
    deleteReport;

window.saveProductionData =
    saveProductionData;

window.refreshProductionData =
    refreshProductionData;

window.getReports =
    getReports;