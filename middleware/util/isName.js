module.exports = (str) => {
    const re = /\S/;
    return(re.test(str));
}