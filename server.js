const express = require('express');
const axios = require("axios");
const app = express();
const redis = require("redis")

const port = process.env.PORT || 3000;
let redisClient;

(async ()=>{
    redisClient = redis.createClient();
    redisClient.on("error", (error) => console.error(`Error: ${error}`))
    await redisClient.connect();
})();


async function fetchApiData(species) {
    const apiResponse = await axios.get(
        `https://www.fishwatch.gov/api/species/${species}`
    );
    console.log("Request sent to the API");
    return apiResponse.data;
}


async function getSpeciesData(req, res) {
        const species = req.params.species;
        let results;
        let isCached =  false;
    try {
        const cacheResult = await redisClient.get(species);
        if(cacheResult){
            isCached = true;
            results = JSON.parse(cacheResult);
        }else{
        results = await fetchApiData(species)
        if(results.length === 0){
            throw "API returned an empty array"
        }
        await redisClient.set(species, JSON.stringify(results));
        }
    res.send({
        fromCache: isCached,
        data: results,
    });
    } catch (error) {
        console.log(error);
            res.status(404).Send("Data unavailable");  
    }  
}


app.get("/fish/:species", getSpeciesData)
app.listen(port, ()=>{
console.log(`App listene ${port}`);
});






