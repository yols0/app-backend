// Generate random integer in range [min, max)
function randomIntGenerator(min, max) {
    return () => Math.floor(Math.random() * (max - min)) + min;
}

module.exports = {
    randomIntGenerator,
};
