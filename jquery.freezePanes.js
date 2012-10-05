/**
 * Copyright 2010-2012 Dustin Barnes
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *
 * Based on http://plugins.jquery.com/project/FixedTable
 * Several issues were found. Logic errors, poor style, inconsistent functionality,
 * redundant calls, etc., so I am rewriting and optimizing the plugin.
 *
 * Call like so:
 * <script type="text/javascript">
 *     $(document).ready(function()
 *     {
 *         $("#freezePanes").freezePanes();
 *     });
 * </script>
 *
 * The only extra markup required is a wrapping div (with an id) for the table.
 * See samples on github for more ideas.
 */

(function($) {
    var freezePanesDefaults = {
        width: $(window).width() - 40,
        height: $(window).height() - 20,
        fixedFirstColumn: true,
        fixedColumnWidth: 225,
        minColumnWidth: 1
    };

    $.fn.freezePanes = function(opts) {
        var options = $.extend({}, freezePanesDefaults, opts);

        var originalTable = this;

        var layout = buildLayout(originalTable, options);

        var scrollAreaWidth = options.width - options.fixedColumnWidth;

        // trick to at least TRY to make it normal looking
        // That way 2-column tables don't need horizontal scrolling...
        $(this).css({ width: scrollAreaWidth });

        $(".fixedContainer .fixedHead", layout).css({
            width: (scrollAreaWidth) + "px",
            "float": "left",
            "overflow": "hidden"
        });

        $(".fixedContainer .fixedTable", layout).css({
            "float": "left",
            width: (scrollAreaWidth + 16) + "px",
            "overflow": "auto"
        });

        $(".fixedContainer", layout).css({
            width: (scrollAreaWidth) + "px",
            "float": "left"
        });

        $(".fixedContainer .fixedFoot", layout).css({
            width: (scrollAreaWidth) + "px",
            "float": "left",
            "overflow": "hidden"
        });

        $(".fixedColumn > .fixedTable", layout).css({
            "width": options.fixedColumnWidth + "px",
            "overflow": "hidden"
        });

        $(".fixedColumn .fixedHead", layout).css({
            "width": options.fixedColumnWidth + "px"
        });

        $(".fixedColumn .fixedFoot", layout).css({
            "width": options.fixedColumnWidth + "px"
        });

        adjustSizes(layout, options);
        applyScrollHandler(layout);

        return layout;
    };

    function buildLayout(src, options)
    {
        var fixedArea = $("<div class=\"fixedArea\"></div>").appendTo($(src).parent());

        //fixed column items
        var fixedColumn = $("<div class=\"fixedColumn\" style=\"float: left;\"></div>").appendTo(fixedArea);
        var fixedColumnHead = $("<div class=\"fixedHead\"></div>").appendTo(fixedColumn);
        var fixedColumnBody = $("<div class=\"fixedTable\"></div>").appendTo(fixedColumn);
        var fixedColumnFooter = $("<div class=\"fixedFoot\"></div>").appendTo(fixedColumn);

        //fixed container items
        var contentContainer = $("<div class=\"fixedContainer\"></div>").appendTo(fixedArea);
        var contentContainerHeader = $("<div class=\"fixedHead\"></div>").appendTo(contentContainer);
        var contentContainerBody = $("<div class=\"fixedTable\"></div>").appendTo(contentContainer);
        var contentContainerFooter = $("<div class=\"fixedFoot\"></div>").appendTo(contentContainer);

        //create the fixed column area
        if ( options.fixedFirstColumn )
        {
            buildFixedColumns(src, "thead", fixedColumnHead);
            buildFixedColumns(src, "tbody", fixedColumnBody);
            buildFixedColumns(src, "tfoot", fixedColumnFooter);
        }

        //Build fixed header / footer rows
        buildFixedRows(src, "thead", contentContainerHeader);
        buildFixedRows(src, "tfoot", contentContainerFooter);

        // Build the main table -- the src table should only be a tbody section with the remaining columns,
        // so we'll just add it to the fixedContainer table area.
        contentContainerBody.append(src);
        return fixedArea;
    }

    function buildFixedColumns(src, section, target)
    {
        if ($("> " + section, src).length) {
            var colHead = $("<table></table>").appendTo(target);

            //If we have a thead or tfoot, we're looking for "TH" elements, otherwise we're looking for "TD" elements
            var cellType = "td";
            if ( section.toLowerCase() == "thead" || section.toLowerCase() == "tfoot" )
            {
                cellType = "th";
            }

            //check each of the rows in the thead
            $("> " + section + " > tr", src).each(function() {
                var tr = $("<tr></tr>").appendTo(colHead);
                $(cellType + ":first", this).each(function() {
                    $("<td>" + $(this).html() + "</td>").addClass(this.className).attr("id", this.id).appendTo(tr);
                    //Note, we copy the class names and ID from the original table cells in case there is any processing on them.
                    //However, if the class does anything with regards to the cell size or position, it could mess up the layout.

                    //Remove the item from our src table.
                    $(this).remove();
                });
            });
        }
    }

    function buildFixedRows(src, section, target) {
        if ($(section, src).length) {
            var th = $("<table></table>").appendTo(target);
            var tr = null;

            //This function only manipulates scrollable headers and footers
            var cellType = "th";

            $("> " + section + " > tr", src).each(function() {
                var tr = $("<tr></tr>").appendTo(th);
                $(cellType, this).each(function() {
                    $("<td>" + $(this).html() + "</td>").addClass(this.className).attr("id", this.id).appendTo(tr);
                });

            });

            $(section, src).remove();
        }
    }

    function applyScrollHandler(layout)
    {
        $(".fixedContainer > .fixedTable", layout).scroll(function() {
            var tblarea = $(".fixedContainer > .fixedTable", layout);

            $(".fixedColumn > .fixedTable", layout)[0].scrollTop = tblarea[0].scrollTop;

            var x = tblarea[0].scrollLeft;
            $(".fixedContainer > .fixedHead", layout)[0].scrollLeft = x;
            $(".fixedContainer > .fixedFoot", layout)[0].scrollLeft = x;
        });
    }

    function adjustSizes(layout, options)
    {
        setScrollingAreaHeights(layout, options);
        setRowHeights(layout);
        setColumnWidths(layout, options);
        adjustTablesForScrollBars(layout, options);
    }

    function adjustTablesForScrollBars(layout, options)
    {
        var contentTableHeight = $(".fixedContainer .fixedTable > table", layout).height();
        if ( contentTableHeight < options.height )
        {
            $(".fixedColumn .fixedTable", layout).height(contentTableHeight + 20);
            $(".fixedContainer .fixedTable", layout).height(contentTableHeight + 20);

            // add back 16px for lack of scroll bar
            $(".fixedContainer .fixedHead", layout).width($(".fixedContainer .fixedHead", layout).width() + 16);
            $(".fixedContainer .fixedFoot", layout).width($(".fixedContainer .fixedHead", layout).width());
        }
        else
        {
            //offset the footer by the height of the scrollbar so that it lines up right.
            $(".fixedColumn > .fixedFoot", layout).css({
                "position": "relative",
                "top": 16
            });
        }
    }

    function setRowHeights(layout)
    {
        // Body
        $(".fixedColumn .fixedTable > table > tbody > tr", layout).each(function(i) {
            var fixedColumnHeight = $(this).height();
            var contentColumn = $(".fixedContainer .fixedTable > table > tbody > tr", layout).eq(i);
            var maxHeight = Math.max(contentColumn.height(), fixedColumnHeight);

            $(this).children("td").height(maxHeight);
            $(".fixedContainer .fixedTable > table > tbody > tr", layout).eq(i).children("td").height(maxHeight);
        });

        // Header
        var topLeftCorner = $(".fixedColumn .fixedHead > table > tbody > tr", layout).eq(0);
        var topHeadRow = $(".fixedContainer .fixedHead > table > tbody > tr", layout);

        var maxHeight = Math.max(topLeftCorner.height(), topHeadRow.eq(0).height());

        topLeftCorner.children("td").height(maxHeight);
        topHeadRow.children("td").height(maxHeight);

        // Footer
        var bottomLeftCorner = $(".fixedColumn .fixedFoot > table > tbody > tr", layout).eq(0);
        var bottomFootRow = $(".fixedContainer .fixedFoot > table > tbody > tr", layout);

        maxHeight = Math.max(bottomLeftCorner.height(), bottomFootRow.eq(0).height());

        bottomLeftCorner.children("td").height(maxHeight);
        bottomFootRow.children("td").height(maxHeight);
    }

    function setScrollingAreaHeights(layout, options)
    {
        var scrollAreaHeight = options.height - $(".fixedContainer > .fixedHead", layout).height()
                - parseInt($(".fixedContainer > .fixedFoot", layout).height());

        $(".fixedContainer > .fixedTable", layout).height(scrollAreaHeight);
        // remove 16px for horizontal scrollbar height
        $(".fixedColumn > .fixedTable", layout).height(scrollAreaHeight - 16);
    }

    function setColumnWidths(layout, options)
    {
        setFixedColumnWidths(layout, options);

        var widthArray = new Array();
        var totalLength = 0;

        $(" .fixedContainer .fixedHead > table > tbody > tr:first > td", layout).each(function(pos)
        {
            var headerColumnWidth = $(this).outerWidth();
            var bodyColumn = $(" .fixedContainer .fixedTable > table > tbody > tr:first > td:eq(" + pos + ")", layout);
            var contentWidth = $(bodyColumn).outerWidth();
            headerColumnWidth = Math.max(headerColumnWidth, contentWidth, options.minColumnWidth);
            widthArray[pos] = headerColumnWidth;
            totalLength += headerColumnWidth;
        });

        $(".fixedContainer .fixedHead > table", layout).width(totalLength);
        $(".fixedContainer .fixedTable > table", layout).width(totalLength);
        $(".fixedContainer .fixedFoot > table", layout).width(totalLength);
        for ( var i = 0; i < widthArray.length; i++ )
        {
            setFixedWidth($(".fixedContainer .fixedHead > table > tbody > tr > td:eq(" + i + ")", layout), widthArray[i]);
            setFixedWidth($(".fixedContainer .fixedTable > table > tbody > tr > td:eq(" + i + ")", layout), widthArray[i]);
            setFixedWidth($(".fixedContainer .fixedFoot > table > tbody > tr > td:eq(" + i + ")", layout), widthArray[i]);
        }
    }

    function setFixedColumnWidths(layout, options)
    {
        $(".fixedColumn > .fixedHead > table > tbody > tr:first > td", layout).each(function(pos)
        {
            var tblCell = $(".fixedColumn > .fixedTable > table > tbody > tr:first > td:eq(" + pos + ")", layout);
            var tblFoot = $(".fixedColumn > .fixedFoot > table > tbody > tr:first > td:eq(" + pos + ")", layout);

            //something funky requires the 2 offset. cant place it...
            var width = options.fixedColumnWidth - 2;

            // we want fixedColumn widths to be total widths (i.e., include padding in width)
            var headerPadding = $(this).innerWidth() - $(this).width();
            setFixedWidth(this, width - headerPadding);

            var colPadding = $(tblCell).innerWidth() - $(tblCell).width();
            setFixedWidth(tblCell, width - colPadding);

            var footerPadding = $(tblFoot).innerWidth() - $(tblFoot).width();
            setFixedWidth(tblFoot, width - footerPadding);
        });
    }

    function setFixedWidth(object, width)
    {
        $(object).css({
            width: (width) + "px",
            "max-width": (width) + "px",
            "min-width": (width) + "px"
        });
    }
})(jQuery);
