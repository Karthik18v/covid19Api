const express = require("express");
const path = require("path");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
app.use(express.json());

const initializeDBAndServer = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  app.listen(3000, () => console.log(`http://localhost:3000`));
};

const convertDbObjectToResponseObjectOfDistrict = (eachDistrict) => {
  return {
    districtId: eachDistrict.district_id,
    districtName: eachDistrict.district_name,
    stateId: eachDistrict.state_id,
    cases: eachDistrict.cases,
    cured: eachDistrict.cured,
    active: eachDistrict.active,
    deaths: eachDistrict.deaths,
  };
};

const convertDbObjectToResponseObject = (dbResponse) => {
  console.log(dbResponse);
  return {
    stateId: dbResponse.state_id,
    stateName: dbResponse.state_name,
    population: dbResponse.population,
  };
};

const convertDbObjectToResponseObjectOfStateName = (dbResponse) => {
  return {
    stateName: dbResponse.state_name,
  };
};

//get states Test Case:1

app.get("/states/", async (request, response) => {
  const stateQuery = `
    SELECT
    *
    FROM
    state
    ORDER BY
    state_id;`;
  const stateArray = await db.all(stateQuery);

  response.send(
    stateArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//get state By Id testCase:2

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    SELECT
    *
    FROM
    state
    WHERE 
    state_id = ${stateId};`;
  const stateArray = await db.get(stateQuery);
  response.send(convertDbObjectToResponseObject(stateArray));
});

//TestCase3 Post District

app.post("/districts", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const districtQuery = `
    INSERT INTO district(district_name,state_id,cases,cured,active,deaths) VALUES(
        '${districtName}',
        '${stateId}',
        '${cases}',
        '${cured}',
        '${active}',
        '${deaths}'
    )`;
  const dbResponse = await db.run(districtQuery);
  const districtId = dbResponse.lastID;
  response.send("District Successfully Added");
});

//testCase 4 get District by Id

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `
    SELECT
    *
    FROM
    district
    WHERE 
    district_id = ${districtId};`;
  const districtArray = await db.get(districtQuery);
  console.log(districtArray);
  response.send(convertDbObjectToResponseObjectOfDistrict(districtArray));
});

//testCase5 Delete District

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `
    DELETE
    FROM
    district
    WHERE district_id = ${districtId};`;
  const dbResponse = await db.run(districtQuery);
  response.send("District Removed");
});

//POST DISTRICT testCase6

app.put("/districts/:districtId", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrictQuery = `
  UPDATE
  district
  SET
  district_name = '${districtName}',
  state_id = '${stateId}',
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  WHERE 
  district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  console.log(districtId);
  response.send("District Details Updated");
});

//testCase 7 stateWise Stats

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  let totalCases = 0;
  let totalCured = 0;
  let totalActive = 0;
  let totalDeaths = 0;
  const stateQuery = `
    SELECT
    *
    FROM
    district
    WHERE
    state_id = ${stateId};`;
  const stateArray = await db.all(stateQuery);
  stateArray.map((eachState) => {
    totalCases += eachState.cases;
    totalCured += eachState.cured;
    totalActive += eachState.active;
    totalDeaths += eachState.deaths;
  });
  response.send({
    totalCases: totalCases,
    totalCured: totalCured,
    totalActive: totalActive,
    totalDeaths: totalDeaths,
  });
});

//state
app.get("/district/:districtId/details", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `
    SELECT
    *
    FROM
    district
    WHERE 
    district_id = ${districtId};`;
  const districtArray = await db.get(districtQuery);

  const stateId = districtArray.state_id;
  console.log(stateId);
  const stateQuery = `
  SELECT
  state_name
  FROM
  state
  WHERE 
  state_id = ${stateId};`;
  const stateArray = await db.get(stateQuery);
  response.send(convertDbObjectToResponseObjectOfStateName(stateArray));
});

initializeDBAndServer();

module.exports = app;
