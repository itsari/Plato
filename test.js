const { fetchCarDetails } = require('./helper');

async function test() {
    const plate = '4355176';
    try {
        const details = await fetchCarDetails(plate);
        console.log(`Car details for plate ${plate}:`, details);
    } catch (error) {
        console.error(error.message);
    }
}

test();
