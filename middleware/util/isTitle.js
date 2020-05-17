module.exports = (str) => {
    const re = /.*\S.*\S.*\S/;
    return(re.test(str));
}