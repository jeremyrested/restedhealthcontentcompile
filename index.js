const keys = require("./constants");
const fetch = require("node-fetch");
const fs = require("fs");

// Global queue, so the processing function can access it.
let imageQueue = [];

function cleanFilename(AirTableData) {
  const originalFilename = AirTableData.filename;
  let lastFilename = originalFilename;
  let filename = originalFilename.replace(" ", "");
  while (lastFilename !== filename) {
    lastFilename = filename;
    filename = filename.replace(" ", "");
  }
  return filename;
}

async function fetchRecords(tableName, debug) {
  try {
    let objects = {};
    let firstTime = true;
    let offset = null;

    let baseURL = `https://api.airtable.com/v0/${keys.AirTableBaseKey}/${tableName}`;

    while (firstTime || offset) {
      let offsetClause = `?offset=${offset}`;
      let url = offset ? baseURL + offsetClause : baseURL;

      let result = await fetch(url, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          Accept: "*/*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${keys.AirTableBearerToken}`,
        },
      });
      let data = await result.json();
      offset = data.offset;
      firstTime = false;
      if (debug) {
        console.log("data", data);
      }

      data.records.forEach((record) => {
        // TODO: Filter records based on them being valid.  Record with blank name or no cards are junk.
        let card = record.fields;
        card.id = record.id;
        objects[card.id] = card;
      });
    }

    return objects;
  } catch (error) {
    console.log("index:fetchTopics -> Error fetching Topics: ", error);
    return [];
  }
}

async function downloadImage() {
  if (imageQueue.length > 0) {
    imagesOutstanding = imagesOutstanding + 1;
    const imageRecord = imageQueue.pop();
    // Now fire up no more than parallelFetches downloads
    const response = await fetch(imageRecord.url);
    const buffer = await response.buffer();
    const outputFilename = cleanFilename(imageRecord);
    fs.writeFile("./build/images/" + outputFilename, buffer, () => {
      process.stdout.write(".");
      imagesOutstanding = imagesOutstanding - 1;
      downloadImage();
    });
  }
}

async function main() {
  const debug = false;

  console.log(`==============================`);
  console.log(`=  RUNNING WITH ENV:`);
  console.log(`= baseName: ${keys.basename}`);
  console.log(`= airTableBaseKey ${keys.AirTableBaseKey}`);
  console.log(`==============================\n`);
  console.log(`Calling fetchTopics`);
  const topics = await fetchRecords("Topic", debug);
  console.log(`fetched ${Object.keys(topics).length} topics to process.`);
  const cards = await fetchRecords("JourneyCard", debug);
  console.log(`fetched ${Object.keys(cards).length} cards to process.`);
  const steps = await fetchRecords("JourneySteps", debug);
  console.log(`fetched ${Object.keys(steps).length} steps to process.`);
  const quizs = await fetchRecords("Quiz", debug);
  console.log(`fetched ${Object.keys(quizs).length} quizs to process.`);
  const topicRules = await fetchRecords("Topic Rules", debug);
  console.log(
    `fetched ${Object.keys(topicRules).length} topic rules to process.`
  );
  const documents = await fetchRecords("Documents", debug);
  console.log(`fetched ${Object.keys(documents).length} documents to process.`);

  console.log(
    `images to fetch: ${
      Object.keys(steps).filter((stepId) => steps[stepId]["Top Image"]).length
    }`
  );

  // Write the heder for the appImages.js file
  fs.writeFileSync("./build/content/appImages.js", "const appImages = {\n", {
    flag: "w+",
  });
  // Build a queue of images to fetch
  // The image records need to be transformed into smaller data,
  //and simply the filename.  Don't need the rest of the record.
  //
  // This transformation needs to happen before the step record is written to disk, but after that
  Object.keys(steps)
    .filter((stepId) => steps[stepId]["Top Image"])
    .forEach((stepId) => {
      const imageRecord = steps[stepId]["Top Image"][0];
      imageQueue.push({ ...imageRecord }); // Create a copy of the image record data, so we can mutate the data on the step.
      steps[stepId]["Top Image"] = cleanFilename(imageRecord); // Replace the Topp Image data with the resulting clean filename
      fs.writeFileSync(
        "./build/content/appImages.js",
        `\t"${steps[stepId]["Top Image"]}": require("../assets/images/${steps[stepId]["Top Image"]}"),\n`,
        { flag: "a" }
      );
    });
  fs.writeFileSync(
    "./build/content/appImages.js",
    `};\n\nexport default appImages;\n`,
    { flag: "a" }
  );

  const parallelFetches = 5;
  // Fire off the downloads.
  for (let i = 0; i < parallelFetches; i++) {
    downloadImage();
  }
  return { topics, cards, steps, quizs, topicRules, documents };
}

let imagesOutstanding = 0;

main().then((finalContent) => {
  imagesOutstanding = imagesOutstanding + 1;
  fs.writeFile(
    "./build/content/content.json",
    JSON.stringify(finalContent),
    (err) => {
      if (err) {
        console.log("Error writing file", err);
      } else {
        console.log("Successfully write content file.");
      }
      imagesOutstanding = imagesOutstanding - 1;
    }
  );

  waitForExit();
});

function waitForExit() {
  if (imageQueue.length > 0 || imagesOutstanding > 0) {
    setTimeout(waitForExit, 500);
  } else {
    console.log("Done.");
  }
}
