const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetch car details from an external website by plate number.
 * @param {string} plate - The car's plate number.
 * @returns {Promise<Object>} - Returns an object with car details.
 */
async function fetchCarDetails(plate) {
    const url = `https://www.find-car.co.il/car/private/${plate}`;

    try {
        // Fetch the HTML content of the page
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Replace these with the correct selectors or XPaths
        const carDetails = {
            vehicleType: $("body > div.main_wrapper > div.container.body-content > main > div.auto_margin > section > div:nth-child(3) > div.side_two > ul > li:nth-child(1) > strong").text().trim(),
            color: $("body > div.main_wrapper > div.container.body-content > main > div.auto_margin > section > div:nth-child(3) > div.side_one > ul > li.has_more_detials_conti > strong").text().trim(),
            car_maker: $("body > div.main_wrapper > div.container.body-content > main > div.auto_margin > section > div:nth-child(3) > div.side_one > ul > li:nth-child(1) > strong").text().trim(),
            model: $("body > div.main_wrapper > div.container.body-content > main > div.auto_margin > section > div:nth-child(3) > div.side_one > ul > li:nth-child(2) > strong").text().trim(),
            build_year: $("body > div.main_wrapper > div.container.body-content > main > div.auto_margin > section > div:nth-child(3) > div.side_one > ul > li:nth-child(4) > strong").text().trim(),
        };

        return carDetails;
    } catch (error) {
        console.error(`Error fetching details for plate ${plate}:`, error.message);
        throw new Error("Failed to fetch car details.");
    }
}

module.exports = { fetchCarDetails };
