const Scanner = require("./Scanner.js");
const fs = require("fs");

const categories = [
    "EVENTS OF INTEREST TO STUDENTS",
    "ACADEMIC PROGRAMS",
    "BUSINESS & JOBS",
    "COMMUNITY SERVICE",
    "LEADERSHIP, COLLEGE PREP, GOVERNMENT, LAW, ADVOCACY, INTERNATIONAL",
    "MUSEUMS & ART & PHOTOGRAPHY",
    "PARKS/NATURE",
    "STEM OPPORTUNITIES",
    "ENGINEERING/MATH/COMPUTER SCIENCE",
    "MEDICAL/LIFE SCIENCES",
    "THEATER/WRITING/MUSIC/VIDEO",
    "CONTESTS & COMPETITIONS",
    "SCHOLARSHIPS"
];
const skippedLines = [
    "RETURN TO TOP",
    "Next Events Approaching"
] 
const starters = [ // sometimes the starters can be on a different line
    "New:",
    "Deadline Approaching:", 
    "Event Approaching:", 
    "Events Approaching:",
    "Information Session Approaching:"
];
const opportunityFields = [
    "Eligible",
    "Dates",
    "Location",
    "Cost",
    "Application Deadline",
    "Date",
    "Links",
    "Link", // Links has to be above Link because if it starts with "Links" it starts with "Link" as well
    "Examples of Courses Offered"
]

const run = async () => {
    const WordExtractor = require("word-extractor"); 
    const extractor = new WordExtractor();
    const extracted = await extractor.extract("test.docx");

    let data = new Scanner(extracted._body);

    let currentCategory = "";
    let parsingOpportunity = false;
    let opportunities = [];
    let currentOpportunity = {}
    let currentField = "";

    let bulletinInfo = {
        no: data.nextLine(),
        date: data.nextLine(),
    }
    data.nextLines(28); // get rid of introductory paragraphs
    let linesRead = 0;
    let lineNum = 0;

    while(
        data.hasNextLine() && 
        (!linesRead || lineNum < linesRead)
    ) {
        let line = data.nextLine();
        

        // skipped lines
        let s = false;
        for (let skip of skippedLines) {
            if (line.startsWith(skip)) {
                s = true;
                break;
            }
        }
        if (s) continue;

        let isCategory = categories.find(category => category == line.toUpperCase() || category == line.toUpperCase().slice(0, line.length-1));
        if (isCategory) {
            currentCategory = isCategory;
            continue;
        }

        /* OPPORTUNITY START CHECK */
        if (!parsingOpportunity) {
            // check if starter is on same line or different line
            for (let starter of starters) {
                let starterInd = line.indexOf(starter);
                if (starterInd != -1) {
                    line = line.slice(0, starterInd) + line.slice(starterInd + starter.length);
                }
            }
            
            line = line.trim();
            if (!line.length) line = data.nextLine();
            
            parsingOpportunity = true;
            currentOpportunity.title = line;
            currentOpportunity.category = currentCategory;
            line = data.nextLine();

        }

        if (parsingOpportunity) {
            let opField = getOpportunityField(line);
            if (opField.length) {
                currentField = opField;
                line = line.slice(opField.length + 1).trim();
            }
            
            if (!currentField.length) {
                if (!currentOpportunity.description) currentOpportunity.description = "";
                currentOpportunity.description += line;
                continue;
            }

            if (currentField == "Links" || currentField == "Link") {
                let urls = [];
                
                if (currentField == "Link") {
                    
                    // for some reason this can be on a next line too
                    // FOR SOME REASON, IT CAN BE SPLIT ON MULTIPLE LINES AS WELL
                    if (hasLink(line)) {
                        let l = data.nextLine();
                        let nex = data.defaultPeekLine();
                        if (l.length >= 70 && nex.length > 0 && !hasLink(nex)) l += data.nextLine();
                        urls.push(l);
                    }
                    while(hasLink(data.peekLine())) {
                        let l = data.nextLine();
                        let nex = data.defaultPeekLine();
                        if (l.length >= 70 && nex.length > 0 && !hasLink(nex)) l += data.nextLine();
                        urls.push(l);
                    }
                } else {
                    if (hasLink(line)) {
                        let l = data.nextLine();
                        let nex = data.defaultPeekLine();
                        if (l.length >= 70 && nex.length > 0 && !hasLink(nex)) l += data.nextLine();
                        urls.push(l);
                    }
                    while(hasLink(data.peekLine())) {
                        let l = data.nextLine();
                        let nex = data.defaultPeekLine();
                        if (l.length >= 70 && nex.length > 0 && !hasLink(nex)) l += data.nextLine();
                        urls.push(l);
                    }
                }

                // this works, save it to opportunity data
                currentOpportunity.links = urls;
                opportunities.push(currentOpportunity);
                parsingOpportunity = false;
                currentOpportunity = {};
                currentField = "";
            } else if (currentField == "Examples of Courses Offered") {
                currentOpportunity.description += line;
            } else {
                if (!currentOpportunity[currentField.toLowerCase()]) currentOpportunity[currentField.toLowerCase()] = "";
                currentOpportunity[currentField.toLowerCase()] += line;
            }
        }
        
        lineNum++;
    }

    fs.writeFileSync("opportunities.json", JSON.stringify(opportunities));
}

const getOpportunityField = (str) => {
    for (let fieldName of opportunityFields) {
        if (str.startsWith(fieldName)) return fieldName;
    }

    return false;
}

const hasLink = (str) => {
    return str.startsWith("http");
}

run();
