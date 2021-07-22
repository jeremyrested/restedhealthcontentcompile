const AirTableAPIBaseURL = "https://api.airtable.com/v0/";

// The three Bases keys.
const AirTableDevelopmentBaseKey = "app55BQUNmfa9nevE";
const AirTableStagingBaseKey = "app9eJYVDcWygROgP";
const AirTableProductionBaseKey = "app7zGMRlAZkyNtCS";

// Auth Token from AirTable
const AirTableBearerToken = "key115zBHXt7KWJ0a";

// Current Base Key
let AirTableBaseKey = AirTableProductionBaseKey;

// The current base used when the application starts
let basename = "production";

function setBase(newBasename) {
  switch (newBasename) {
    case "production":
      AirTableBaseKey = AirTableProductionBaseKey;
      basename = newBasename;
      break;
    case "staging":
      AirTableBaseKey = AirTableStagingBaseKey;
      basename = newBasename;
      break;
    case "development":
      AirTableBaseKey = AirTableDevelopmentBaseKey;
      basename = newBasename;
      break;
  }
}

// Set the default base
setBase(basename);

module.exports = { basename, setBase, AirTableBaseKey, AirTableBearerToken };
