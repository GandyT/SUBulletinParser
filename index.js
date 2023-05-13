const Scanner = require("./Scanner.js");

const run = async () => {
    const WordExtractor = require("word-extractor"); 
    const extractor = new WordExtractor();
    const extracted = await extractor.extract("test.docx");

    console.log(extracted);

    let data = new Scanner(extracted._body);
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
        "OPPORTUNITY LISTS AND RESOURCES",
        "SCHOLARSHIPS"
    ];
    let currentCategory = "";

    let bulletinInfo = {
        no: data.nextLine(),
        date: data.nextLine(),
    }
    data.nextLines(28); // get rid of introductory paragraphs
    let linesRead = 100;
    let lineNum = 0;

    while(data.hasNextLine() && (linesRead && lineNum < linesRead)) {
        let line = data.nextLine();
        let isCategory = categories.find(category => category == line.toUpperCase() || category == line.toUpperCase().slice(0, line.length-1));
        if (isCategory) {
            currentCategory = isCategory;
            continue;
        }

        lineNum++;
        

    }
}

run();
