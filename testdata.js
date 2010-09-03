function testdata(tableid, options)
{
    var opts = {
        numColumns: 25,
        numRows: 50,
        freaky: false,
        freakyHeaderMin: 0,
        freakyHeaderMax: 4,
        freakyBodyMin: 0,
        freakyBodyMax: 8,
        suppressRowColCounter: false
    };

    $.extend(opts, options);

    var thead = $(tableid + " thead");
    var tfoot = $(tableid + " tfoot");
    var tbody = $(tableid + " tbody");

    for ( var row = 1; row <= opts.numRows; row++ )
    {
        if ( row == 1 )
        {
            fillColumns(thead, "th", row, opts);
        }
        else if ( row == opts.numRows )
        {
            fillColumns(tfoot, "th", row, opts);
        }
        else
        {
            fillColumns(tbody, "td", row, opts);
        }
    }
}

function fillColumns(container, type, row, opts)
{
    var tr = $("<tr></tr>").appendTo(container);
    for ( var col = 1; col <= opts.numColumns; col++ )
    {
        var text = generateText(row, col, opts);
        $("<" + type + ">" + text + "</" + type + ">").appendTo(tr);
    }
}

function generateText(row, column, opts)
{
    var text = opts.suppressRowColCounter ? "&nbsp;" : (row + ", " + column + " ");

    var lorem = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi.".split(' ');
    if ( opts.freaky )
    {
        var numWords = 0;

        if ( row == 1 || row == opts.numRows )
        {
            numWords = rand(opts.freakyHeaderMin, opts.freakyHeaderMax);
        }
        else
        {
            numWords = rand(opts.freakyBodyMin, opts.freakyBodyMax);
        }

        for ( var i = 0; i < numWords; i++ )
        {
            text += lorem[rand(0, lorem.length)] + " ";
        }
    }

    return text;
}

function rand(min, max)
{
    return min + Math.floor(Math.random() * (max - min));
}
