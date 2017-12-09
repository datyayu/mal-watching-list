"use strict";

const serverless = require("serverless-http");
const express = require("express");
const fetch = require("node-fetch");
const JXON = require("jxon");
const app = express();

/**
 * Generate the endpoint where to fetch the user's animelist.
 *
 * @param {string} username Username to fetch the data from.
 * @return {string} Generated endpoint url.
 */
function getMalEndpoint(username) {
  const usernameEncodedValue = encodeURIComponent(username);
  return `https://myanimelist.net/malappinfo.php?u=${
    usernameEncodedValue
  }&status=all&type=anime`;
}

/**
 * Get the complete anime list for the given user.
 * We request the entire list because that's the only
 * *officially supported* way to fetch the data.
 *
 * @param {string} username Username to fetch the data from.
 * @return {Promise<object>} The fetched list info, or null if something goes wrong.
 */
function fetchListData(username) {
  const endpoint = getMalEndpoint(username);

  return new Promise((resolve, reject) => {
    fetch(endpoint)
      .then(response => response.text())
      .then(data => {
        const parsedData = JXON.stringToJs(data);
        resolve(parsedData.myanimelist.anime);
      })
      .catch(e => {
        reject("error fetching the data");
      });
  });
}

/**
 * Check whether an anime entity currently has the
 * "watching" status on the user's list.
 *
 * @param {object} anime Anime entity to eval.
 * @return {boolean} true if watching, false otherwise.
 */
function isTheAnimeCurrentlyBeingWatched(anime) {
  return anime["my_status"] === "1";
}

/**
 * Map the resulting anime entity from parsing the XML
 * into a more user-friendly and simpler shape so
 * we can use it more easily.
 *
 * @param {object} entity Anime XML Entity to eval.
 * @return {object} The mapped anime series.
 */
function mapXMLEntityToAnimeSeries(entity) {
  return {
    id: entity["series_animedb_id"],
    title: entity["series_title"],
    image: entity["series_image"],
    isAiring: entity["series_status"] === "1",
    totalEpisodes: parseInt(entity["series_episodes"], 10),
    watchedEpisodes: parseInt(entity["my_watched_episodes"], 10)
  };
}

/**
 * Sort series using the last time the user made an update to it
 * as comparison.
 *
 * @param {object} animeA
 * @param {object} animeB
 * @return {number} n where
 *            n < 0 if A was updated last.
 *            n > 0 if B was updated last.
 *            n = 0 if neither a nor b have been updated.
 */
function sortSeriesByLastUpdate(animeA, animeB) {
  const aUpdate = animeA["my_last_updated"];
  const bUpdate = animeB["my_last_updated"];

  if (!aUpdate) {
    if (!bUpdate) {
      return 0; // No updates on a nor b
    }

    return 1; // just b was updated so push it forward
  }

  if (!bUpdate) return -1; // just a was updated so push it forward

  return bUpdate - aUpdate;
}

/**
 * Filter the given animelist to include only currently
 * watching anime.
 *
 * @param {Array<object>} animelist List to filter.
 * @return {Array<object>} filtered list.
 */
function getWatchingList(animelist) {
  return animelist
    .filter(isTheAnimeCurrentlyBeingWatched)
    .sort(sortSeriesByLastUpdate)
    .map(mapXMLEntityToAnimeSeries);
}

/**
 * Main handler
 */
app.get("/animelist", (req, res) => {
  // Get user info
  const user = req.query.user;
  if (!user) return res.json([]);

  fetchListData(user)
    .then(list => {
      if (!list) {
        throw new Error("error getting the user data");
      }

      const animelist = getWatchingList(list);
      return res.json(animelist);
    })
    .catch(error => {
      console.log(error);
      return res.json([]);
    });
});

module.exports.handler = serverless(app);
