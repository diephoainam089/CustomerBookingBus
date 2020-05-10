module.exports.FormatPrice = (Num) => {
    var Strings = ""
    var StringNum = Num.toString()
    var StringLength = StringNum.length
    if (StringLength % 3 == 0) {
        for (var index = 0; index < StringNum.length; index++) {
            Strings += StringNum[index]
            if (index % 3 == 2 && index < StringNum.length - 1)
                Strings += "."
        }
    } else if (StringLength % 3 == 1) {
        Strings = StringNum[0]
        if (StringLength > 1)
            Strings += "."
        StringNum = StringNum.slice(1)
        for (var index = 0; index < StringNum.length; index++) {
            Strings += StringNum[index]
            if (index % 3 == 2 && index < StringNum.length - 1)
                Strings += "."

        }
    } else if (StringLength % 3 == 2) {
        Strings = StringNum[0] + StringNum[1]
        if (StringLength > 2)
            Strings += "."
        StringNum = StringNum.slice(2)
        for (var index = 0; index < StringNum.length; index++) {
            Strings += StringNum[index]
            if (index % 3 == 2 && index < StringNum.length - 1)
                Strings += "."
        }
    }
    return Strings
}