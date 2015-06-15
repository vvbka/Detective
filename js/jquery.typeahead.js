/*!
 * jQuery Typeahead
 * Copyright (C) 2015 RunningCoder.org
 * Licensed under the MIT license
 *
 * @author Tom Bertrand
 * @version 2.0.0-rc.3 (2015-05-26)
 * @link http://www.runningcoder.org/jquerytypeahead/
 */
! function (a, b, c, d) {
    a.Typeahead = {};
    var e = {
            input: null,
            minLength: 2,
            maxItem: 8,
            dynamic: !1,
            delay: 300,
            order: null,
            offset: !1,
            hint: !1,
            accent: !1,
            highlight: !0,
            group: !1,
            maxItemPerGroup: null,
            dropdownFilter: !1,
            dynamicFilter: null,
            backdrop: !1,
            cache: !1,
            ttl: 36e5,
            compression: !1,
            suggestion: !1,
            searchOnFocus: !1,
            resultContainer: null,
            generateOnLoad: null,
            href: null,
            display: ["display"],
            template: null,
            emptyTemplate: !1,
            source: null,
            callback: {
                onInit: null,
                onReady: null,
                onSearch: null,
                onResult: null,
                onLayoutBuiltBefore: null,
                onLayoutBuiltAfter: null,
                onNavigate: null,
                onMouseEnter: null,
                onMouseLeave: null,
                onClickBefore: null,
                onClickAfter: null,
                onSubmit: null
            },
            selector: {
                container: "typeahead-container",
                group: "typeahead-group",
                result: "typeahead-result",
                list: "typeahead-list",
                display: "typeahead-display",
                query: "typeahead-query",
                filter: "typeahead-filter",
                filterButton: "typeahead-filter-button",
                filterValue: "typeahead-filter-value",
                dropdown: "typeahead-dropdown",
                dropdownCarret: "typeahead-caret",
                button: "typeahead-button",
                backdrop: "typeahead-backdrop",
                hint: "typeahead-hint"
            },
            debug: !1
        },
        f = ".typeahead",
        g = {
            from: "ãàáäâẽèéëêìíïîõòóöôùúüûñç",
            to: "aaaaaeeeeeiiiiooooouuuunc"
        },
        h = function (a, b) {
            this.rawQuery = "", this.query = "", this.source = {}, this.isGenerated = null, this.generatedGroupCount = 0, this.groupCount = 0, this.groupBy = "group", this.result = [], this.resultCount = 0, this.options = b, this.node = a, this.container = null, this.resultContainer = null, this.item = null, this.dropdownFilter = null, this.xhr = {}, this.hintIndex = null, this.filters = {}, this.requests = {}, this.backdrop = {}, this.hint = {}, this.__construct()
        };
    h.prototype = {
        extendOptions: function () {
            this.options.dynamic && (this.options.cache = !1, this.options.compression = !1), this.options.cache && (this.options.cache = function () {
                var b = "undefined" != typeof a.localStorage;
                if (b) try {
                    a.localStorage.setItem("typeahead", "typeahead"), a.localStorage.removeItem("typeahead")
                } catch (c) {
                    b = !1
                }
                return b
            }()), this.options.compression && ("object" == typeof LZString && this.options.cache || (this.options.compression = !1)), !this.options.maxItem || /^\d+$/.test(this.options.maxItem) && 0 !== this.options.maxItem || (this.options.maxItem = 1 / 0), this.options.maxItemPerGroup && !/^\d+$/.test(this.options.maxItemPerGroup) && (this.options.maxItemPerGroup = null), !this.options.display || this.options.display instanceof Array || (this.options.display = [this.options.display]), !this.options.group || this.options.group instanceof Array || (this.options.group = [this.options.group]), this.options.resultContainer && ("string" == typeof this.options.resultContainer && (this.options.resultContainer = c(this.options.resultContainer)), this.options.resultContainer instanceof jQuery && this.options.resultContainer[0] && (this.resultContainer = this.options.resultContainer)), this.options.group && "string" == typeof this.options.group[0] && this.options.maxItemPerGroup && (this.groupBy = this.options.group[0]), this.options.callback && this.options.callback.onClick && (this.options.callback.onClickBefore = this.options.callback.onClick, delete this.options.callback.onClick), this.options = c.extend(!0, {}, e, this.options)
        },
        unifySourceFormat: function () {
            if (this.options.source instanceof Array) return this.options.source = {
                group: {
                    data: this.options.source
                }
            }, this.groupCount += 1, !0;
            ("undefined" != typeof this.options.source.data || "undefined" != typeof this.options.source.url) && (this.options.source = {
                group: this.options.source
            });
            for (var a in this.options.source)
                if (this.options.source.hasOwnProperty(a)) {
                    if (("string" == typeof this.options.source[a] || this.options.source[a] instanceof Array) && (this.options.source[a] = {
                            url: this.options.source[a]
                        }), !this.options.source[a].data && !this.options.source[a].url) return !1;
                    !this.options.source[a].display || this.options.source[a].display instanceof Array || (this.options.source[a].display = [this.options.source[a].display]), this.options.source[a].ignore && (this.options.source[a].ignore instanceof RegExp || delete this.options.source[a].ignore), this.groupCount += 1
                }
            return !0
        },
        init: function () {
            this.helper.executeCallback(this.options.callback.onInit, [this.node]), this.container = this.node.closest("." + this.options.selector.container)
        },
        delegateEvents: function () {
            var a = this,
                b = ["focus" + f, "input" + f, "propertychange" + f, "keydown" + f, "dynamic" + f, "generateOnLoad" + f];
            this.container.on("click" + f, function (b) {
                b.stopPropagation(), a.options.dropdownFilter && a.container.find("." + a.options.selector.dropdown.replace(" ", ".")).hide()
            }), this.node.closest("form").on("submit", function (b) {
                return a.hideLayout(), a.rawQuery = "", a.query = "", a.helper.executeCallback(a.options.callback.onSubmit, [a.node, this, a.item, b]) ? !1 : void 0
            }), this.node.off(f).on(b.join(" "), function (b) {
                switch (b.type) {
                case "generateOnLoad":
                case "focus":
                    a.isGenerated && a.options.searchOnFocus && a.query.length >= a.options.minLength && a.showLayout(), null !== a.isGenerated || a.options.dynamic || a.generateSource();
                    break;
                case "keydown":
                    a.isGenerated && a.result.length && b.keyCode && ~[13, 27, 38, 39, 40].indexOf(b.keyCode) && a.navigate(b);
                    break;
                case "propertychange":
                case "input":
                    if (a.rawQuery = a.node[0].value.toString(), a.query = a.node[0].value.replace(/^\s+/, "").toString(), a.options.hint && a.hint.container && "" !== a.hint.container.val() && 0 !== a.hint.container.val().indexOf(a.rawQuery) && a.hint.container.val(""), a.options.dynamic) return a.isGenerated = null, void a.helper.typeWatch(function () {
                        a.query.length >= a.options.minLength ? a.generateSource() : a.hideLayout()
                    }, a.options.delay);
                case "dynamic":
                    if (!a.isGenerated) break;
                    if (a.query.length < a.options.minLength) {
                        a.hideLayout();
                        break
                    }
                    a.searchResult(), a.buildLayout(), a.result.length > 0 || a.options.emptyTemplate ? a.showLayout() : a.hideLayout()
                }
            }), this.options.generateOnLoad && this.node.trigger("generateOnLoad" + f)
        },
        generateSource: function () {
            if (!this.isGenerated || this.options.dynamic) {
                if (this.generatedGroupCount = 0, this.isGenerated = !1, !this.helper.isEmpty(this.xhr)) {
                    for (var b in this.xhr) this.xhr.hasOwnProperty(b) && this.xhr[b].abort();
                    this.xhr = {}
                }
                var c, d, e;
                for (c in this.options.source)
                    if (this.options.source.hasOwnProperty(c)) {
                        if (this.options.cache && (d = a.localStorage.getItem(this.node.selector + ":" + c))) {
                            this.options.compression && (d = LZString.decompressFromUTF16(d)), e = !1;
                            try {
                                d = JSON.parse(d + ""), d.data && d.ttl > (new Date).getTime() ? (this.populateSource(d.data, c), e = !0) : a.localStorage.removeItem(this.node.selector + ":" + c)
                            } catch (f) {}
                            if (e) continue
                        }!this.options.source[c].data || this.options.source[c].url ? this.options.source[c].url && (this.requests[c] || (this.requests[c] = this.generateRequestObject(c))) : this.populateSource("function" == typeof this.options.source[c].data && this.options.source[c].data() || this.options.source[c].data, c)
                    }
                this.handleRequests()
            }
        },
        generateRequestObject: function (a) {
            var b = {
                request: {
                    url: null,
                    dataType: "json"
                },
                extra: {
                    path: null,
                    group: a,
                    callback: {
                        onDone: null,
                        onFail: null,
                        onComplete: null
                    }
                },
                validForGroup: [a]
            };
            !(this.options.source[a].url instanceof Array) && this.options.source[a].url instanceof Object && (this.options.source[a].url = [this.options.source[a].url]), this.options.source[a].url instanceof Array ? (this.options.source[a].url[0] instanceof Object ? (this.options.source[a].url[0].callback && (b.extra.callback = this.options.source[a].url[0].callback, delete this.options.source[a].url[0].callback), b.request = c.extend(!0, b.request, this.options.source[a].url[0])) : "string" == typeof this.options.source[a].url[0] && (b.request.url = this.options.source[a].url[0]), this.options.source[a].url[1] && "string" == typeof this.options.source[a].url[1] && (b.extra.path = this.options.source[a].url[1])) : "string" == typeof this.options.source[a].url && (b.request.url = this.options.source[a].url), "jsonp" === b.request.dataType.toLowerCase() && (b.request.jsonpCallback = "callback_" + a);
            var d;
            for (var e in this.requests)
                if (this.requests.hasOwnProperty(e) && (d = JSON.stringify(this.requests[e].request), d === JSON.stringify(b.request))) {
                    this.requests[e].validForGroup.push(a), b.isDuplicated = !0, delete b.validForGroup;
                    break
                }
            return b
        },
        handleRequests: function () {
            var a = this;
            for (var b in this.requests) this.requests.hasOwnProperty(b) && (this.requests[b].isDuplicated || ! function (b, d) {
                var e;
                if (d.request.data)
                    for (var f in d.request.data)
                        if (d.request.data.hasOwnProperty(f) && ~String(d.request.data[f]).indexOf("{{query}}")) {
                            d = c.extend(!0, {}, d), d.request.data[f] = d.request.data[f].replace("{{query}}", a.query);
                            break
                        }
                a.xhr[b] = c.ajax(d.request).done(function (b) {
                    for (var c = 0; c < d.validForGroup.length; c++) e = a.requests[d.validForGroup[c]], e.extra.callback.onDone instanceof Function && e.extra.callback.onDone(b), a.populateSource(b, e.extra.group, e.extra.path)
                }).fail(function () {
                    for (var b = 0; b < d.validForGroup.length; b++) e = a.requests[d.validForGroup[b]], e.extra.callback.onFail instanceof Function && e.extra.callback.onFail()
                }).complete(function () {
                    for (var b = 0; b < d.validForGroup.length; b++) e = a.requests[d.validForGroup[b]], e.extra.callback.onComplete instanceof Function && e.extra.callback.onComplete()
                })
            }(b, this.requests[b]))
        },
        populateSource: function (a, b, c) {
            var d, e = !0;
            if ("string" == typeof c)
                for (var f = c.split("."), g = 0; g < f.length;) {
                    if ("undefined" == typeof a) {
                        e = !1;
                        break
                    }
                    a = a[f[g++]]
                }
            if (a instanceof Array && e) {
                d = this.options.source[b].url && this.options.source[b].data, d && ("function" == typeof d && (d = d()), d instanceof Array && (a = a.concat(d)));
                var h, i;
                i = this.options.source[b].display ? this.options.source[b].display[0] : this.options.display[0];
                for (var j = 0; j < a.length; j++) "string" == typeof a[j] && (h = {}, h[i] = a[j], a[j] = h);
                if (this.source[b] = a, this.options.cache && !localStorage.getItem(this.node.selector + ":" + b)) {
                    var k = JSON.stringify({
                        data: a,
                        ttl: (new Date).getTime() + this.options.ttl
                    });
                    this.options.compression && (k = LZString.compressToUTF16(k)), localStorage.setItem(this.node.selector + ":" + b, k)
                }
                this.incrementGeneratedGroup()
            }
        },
        incrementGeneratedGroup: function () {
            this.generatedGroupCount += 1, this.groupCount === this.generatedGroupCount && (this.isGenerated = !0, this.node.trigger("dynamic" + f))
        },
        navigate: function (a) {
            this.helper.executeCallback(this.options.callback.onNavigate, [this.node, this.query, a]);
            var b = this.resultContainer.find("> ul > li:not([data-search-group])"),
                c = b.filter(".active"),
                d = c[0] && b.index(c) || null;
            if (27 === a.keyCode) return a.preventDefault(), void this.hideLayout();
            if (13 === a.keyCode) return c.length > 0 ? (a.preventDefault(), a.stopPropagation(), void c.find("a:first").trigger("click")) : void this.hideLayout();
            if (39 === a.keyCode) return void(d ? b.eq(d).find("a:first").trigger("click") : this.options.hint && "" !== this.hint.container.val() && this.helper.getCaret(this.node[0]) >= this.query.length && b.find('a[data-index="' + this.hintIndex + '"]').trigger("click"));
            if (b.length > 0 && c.removeClass("active"), 38 === a.keyCode ? (a.preventDefault(), c.length > 0 ? d - 1 >= 0 && b.eq(d - 1).addClass("active") : b.last().addClass("active")) : 40 === a.keyCode && (a.preventDefault(), c.length > 0 ? d + 1 < b.length && b.eq(d + 1).addClass("active") : b.first().addClass("active")), c = b.filter(".active"), this.options.hint && this.hint.container && (c.length > 0 ? this.hint.container.css("color", "transparent") : this.hint.container.css("color", this.hint.css.color)), c.length > 0) {
                var e = c.find("a:first").attr("data-index");
                e && this.node.val(this.result[e][this.result[e].matchedKey])
            } else this.node.val(this.rawQuery)
        },
        searchResult: function () {
            this.helper.executeCallback(this.options.callback.onSearch, [this.node, this.query]), this.result = [], this.resultCount = 0;
            var a, b, c, d, e, f, g = this,
                h = this.query,
                i = {},
                j = this.filters.dropdown && this.filters.dropdown.key || this.groupBy;
            this.options.accent && (h = this.helper.removeAccent(h));
            for (a in this.source)
                if (this.source.hasOwnProperty(a) && (!this.filters.dropdown || "group" !== this.filters.dropdown.key || this.filters.dropdown.value === a)) {
                    if (this.options.maxItemPerGroup && "group" === j)
                        if (i[a]) {
                            if (i[a] >= this.options.maxItemPerGroup && !this.options.callback.onResult) break
                        } else i[a] = 0;
                    f = "undefined" == typeof this.options.source[a].filter || this.options.source[a].filter === !0;
                    for (var k = 0; k < this.source[a].length && (!(this.result.length >= this.options.maxItem) || this.options.callback.onResult); k++) {
                        if (b = this.source[a][k], b.group = a, this.options.maxItemPerGroup && "group" !== j)
                            if (i[b[j]]) {
                                if (i[b[j]] >= this.options.maxItemPerGroup && !this.options.callback.onResult) continue
                            } else i[b[j]] = 0;
                        e = this.options.source[a].display || this.options.display;
                        for (var l = 0; l < e.length; l++) {
                            if (f) {
                                if (d = b[e[l]], !d) continue;
                                if (d = d.toString(), this.options.accent && (d = this.helper.removeAccent(d)), c = d.toLowerCase().indexOf(h.toLowerCase()) + 1, !c) continue;
                                if (c && this.options.offset && 1 !== c) continue;
                                if (this.options.source[a].ignore && this.options.source[a].ignore.test(d)) continue
                            }
                            if (!this.filters.dropdown || this.filters.dropdown.value == b[this.filters.dropdown.key]) {
                                if (this.resultCount += 1, this.options.callback.onResult && this.result.length >= this.options.maxItem || this.options.maxItemPerGroup && i[b[j]] >= this.options.maxItemPerGroup) break;
                                b.matchedKey = e[l], this.result.push(b), this.options.maxItemPerGroup && (i[b[j]] += 1);
                                break
                            }
                        }
                    }
                }
            if (this.options.order) {
                for (var m, e = [], l = 0; l < this.result.length; l++) m = this.options.source[this.result[l].group].display || this.options.display, ~e.indexOf(m[0]) || e.push(m[0]);
                this.result.sort(g.helper.sort(e, "asc" === g.options.order, function (a) {
                    return a.toString().toUpperCase()
                }))
            }
            this.helper.executeCallback(this.options.callback.onResult, [this.node, this.query, this.result, this.resultCount])
        },
        buildLayout: function () {
            this.resultContainer || (this.resultContainer = c("<div/>", {
                "class": this.options.selector.result
            }), this.container.append(this.resultContainer));
            var a = this.query.toLowerCase();
            this.options.accent && (a = this.helper.removeAccent(a));
            var b = this,
                d = c("<ul/>", {
                    "class": this.options.selector.list,
                    html: function () {
                        if (b.options.emptyTemplate && b.helper.isEmpty(b.result)) return c("<li/>", {
                            html: c("<a/>", {
                                href: "javascript:;",
                                html: b.options.emptyTemplate.replace(/\{\{query}}/gi, b.query)
                            })
                        });
                        for (var d in b.result) b.result.hasOwnProperty(d) && ! function (d, e, f) {
                            var g, h, i, j, k, l = e.group,
                                m = {},
                                n = b.options.source[e.group].display || b.options.display,
                                o = b.options.source[e.group].href || b.options.href;
                            b.options.group && ("boolean" != typeof b.options.group[0] && e[b.options.group[0]] && (l = e[b.options.group[0]]), c(f).find('li[data-search-group="' + l + '"]')[0] || c(f).append(c("<li/>", {
                                "class": b.options.selector.group,
                                html: c("<a/>", {
                                    href: "javascript:;",
                                    html: b.options.group[1] && b.options.group[1].replace(/(\{\{group}})/gi, e[b.options.group[0]] || l) || l
                                }),
                                "data-search-group": l
                            })));
                            for (var p = 0; p < n.length; p++) i = n[p], m[i] = e[i], b.options.highlight && m[i] && (m[i] = b.helper.highlight(m[i], a, b.options.accent));
                            g = c("<li/>", {
                                html: c("<a/>", {
                                    href: function () {
                                        return o && ("string" == typeof o ? o = o.replace(/\{\{([a-z0-9_\-]+)}}/gi, function (a, c) {
                                            return e[c] && b.helper.slugify(e[c]) || a
                                        }) : "function" == typeof o && (o = o(e)), e.href = o), o || "javascript:;"
                                    },
                                    "data-group": l,
                                    "data-index": d,
                                    html: function () {
                                        k = e.group && b.options.source[e.group].template || b.options.template, h = k ? k.replace(/\{\{([a-z0-9_\-]+)\|?(\w+)?}}/gi, function (a, b, c) {
                                            return a = e[b] || a, c && "raw" === c ? a : m[b] || a
                                        }) : '<span class="' + b.options.selector.display + '">' + b.helper.joinObject(m, " ") + "</span>", c(this).append(h)
                                    },
                                    click: function (a) {
                                        b.helper.executeCallback(b.options.callback.onClickBefore, [b.node, this, e, a]), a.isDefaultPrevented() || (a.preventDefault(), b.query = b.rawQuery = e[e.matchedKey].toString(), b.node.val(b.query).focus(), b.item = e, b.searchResult(), b.buildLayout(), b.hideLayout(), b.helper.executeCallback(b.options.callback.onClickAfter, [b.node, this, e, a]))
                                    },
                                    mouseenter: function (a) {
                                        c(this).closest("ul").find("li.active").removeClass("active"), c(this).closest("li").addClass("active"), b.helper.executeCallback(b.options.callback.onMouseEnter, [b.node, this, e, a])
                                    },
                                    mouseleave: function (a) {
                                        c(this).closest("li").removeClass("active"), b.helper.executeCallback(b.options.callback.onMouseLeave, [b.node, this, e, a])
                                    }
                                })
                            }), b.options.group ? (j = c(f).find('a[data-group="' + l + '"]:last').closest("li"), j[0] || (j = c(f).find('li[data-search-group="' + l + '"]')), c(g).insertAfter(j)) : c(f).append(g)
                        }(d, b.result[d], this)
                    }
                });
            if (this.options.callback.onLayoutBuiltBefore && (d = this.helper.executeCallback(this.options.callback.onLayoutBuiltBefore, [this.node, this.query, this.result, d]) || d), this.container.addClass("result"), this.resultContainer.html(d), this.options.callback.onLayoutBuiltAfter && this.helper.executeCallback(this.options.callback.onLayoutBuiltAfter, [this.node, this.query, this.result]), this.options.backdrop && (this.backdrop.container ? this.backdrop.container.show() : (this.backdrop.css = c.extend({
                    opacity: .6,
                    filter: "alpha(opacity=60)",
                    position: "fixed",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    "z-index": 1040,
                    "background-color": "#000"
                }, this.options.backdrop), this.backdrop.container = c("<div/>", {
                    "class": this.options.selector.backdrop,
                    css: this.backdrop.css,
                    click: function () {
                        b.hideLayout()
                    }
                }).insertAfter(this.container)), this.container.addClass("backdrop").css({
                    "z-index": this.backdrop.css["z-index"] + 1,
                    position: "relative"
                })), this.options.hint) {
                var f = "";
                if (this.result.length > 0 && this.query.length > 0) {
                    this.hint.container || (this.hint.css = c.extend({
                        "border-color": "transparent",
                        position: "absolute",
                        display: "inline",
                        "z-index": 1,
                        "float": "none",
                        color: "silver",
                        "user-select": "none",
                        "box-shadow": "none"
                    }, this.options.hint), this.hint.container = this.node.clone(!1).attr({
                        "class": e.selector.hint,
                        readonly: !0,
                        tabindex: -1
                    }).addClass(this.node.attr("class")).removeAttr("id placeholder name autofocus autocomplete alt").css(this.hint.css), this.helper.removeDataAttributes(this.hint.container), this.hint.container.insertBefore(this.node), this.node.css({
                        position: "relative",
                        "z-index": 2,
                        "background-color": "transparent"
                    }).parent().css({
                        position: "relative"
                    }));
                    var g, h, i;
                    this.hintIndex = null;
                    for (var j = 0; j < this.result.length; j++) {
                        h = this.result[j].group, g = b.options.source[h].display || b.options.display;
                        for (var k = 0; k < g.length; k++)
                            if (i = String(this.result[j][g[k]]).toLowerCase(), this.options.accent && (i = this.helper.removeAccent(i)), 0 === i.indexOf(a)) {
                                f = String(this.result[j][g[k]]), this.hintIndex = j;
                                break
                            }
                        if (null !== this.hintIndex) break
                    }
                }
                this.hint.container && this.hint.container.val(f.length > 0 && this.rawQuery + f.substring(this.query.length) || "").show()
            }
        },
        buildDropdownLayout: function () {
            function a(a) {
                "*" === a.value ? delete this.filters.dropdown : this.filters.dropdown = a, this.container.removeClass("filter").find("." + this.options.selector.filterValue).html(a.display || a.value), this.node.trigger("dynamic" + f), this.node.focus()
            }
            if (this.options.dropdownFilter) {
                var b, d = this;
                if ("boolean" == typeof this.options.dropdownFilter) b = "all";
                else if ("string" == typeof this.options.dropdownFilter) b = this.options.dropdownFilter;
                else if (this.options.dropdownFilter instanceof Array)
                    for (var e = 0; e < this.options.dropdownFilter.length; e++)
                        if ("*" === this.options.dropdownFilter[e].value && this.options.dropdownFilter[e].display) {
                            b = this.options.dropdownFilter[e].display;
                            break
                        }
                c("<span/>", {
                    "class": this.options.selector.filter,
                    html: function () {
                        c(this).append(c("<button/>", {
                            type: "button",
                            "class": d.options.selector.filterButton,
                            html: "<span class='" + d.options.selector.filterValue + "'>" + b + "</span> <span class='" + d.options.selector.dropdownCarret + "'></span>",
                            click: function (a) {
                                a.stopPropagation();
                                var b = d.container.find("." + d.options.selector.dropdown.replace(" ", "."));
                                b.is(":visible") ? (d.container.removeClass("filter"), b.hide(), c("html").off(f + ".dropdownFilter")) : (d.container.addClass("filter"), b.show(), c("html").off(f + ".dropdownFilter").on("click" + f + ".dropdownFilter", function () {
                                    d.container.removeClass("filter"), b.hide(), c(this).off(f + ".dropdownFilter")
                                }))
                            }
                        })), c(this).append(c("<ul/>", {
                            "class": d.options.selector.dropdown,
                            html: function () {
                                var b = d.options.dropdownFilter;
                                if (~["string", "boolean"].indexOf(typeof d.options.dropdownFilter)) {
                                    b = [];
                                    for (var e in d.options.source) d.options.source.hasOwnProperty(e) && b.push({
                                        key: "group",
                                        value: e
                                    });
                                    b.push({
                                        key: "group",
                                        value: "*",
                                        display: "string" == typeof d.options.dropdownFilter && d.options.dropdownFilter || "All"
                                    })
                                }
                                for (var f = 0; f < b.length; f++) ! function (b, e, f) {
                                    (e.key || "*" === e.value) && e.value && ("*" === e.value && c(f).append(c("<li/>", {
                                        "class": "divider"
                                    })), c(f).append(c("<li/>", {
                                        html: c("<a/>", {
                                            href: "javascript:;",
                                            html: e.display || e.value,
                                            click: function (b) {
                                                b.preventDefault(), a.apply(d, [e])
                                            }
                                        })
                                    })))
                                }(f, b[f], this)
                            }
                        }))
                    }
                }).insertAfter(d.container.find("." + d.options.selector.query))
            }
        },
        showLayout: function () {
            var a = this;
            c("html").off(f).on("click" + f, function () {
                a.hideLayout(), c(this).off(f)
            }), (this.result.length || this.options.emptyTemplate) && this.container.addClass("result hint backdrop")
        },
        hideLayout: function () {
            this.container.removeClass("result hint backdrop filter")
        },
        __construct: function () {
            this.extendOptions(), this.unifySourceFormat() && (this.init(), this.delegateEvents(), this.buildDropdownLayout(), this.helper.executeCallback(this.options.callback.onReady, [this.node]))
        },
        helper: {
            isEmpty: function (a) {
                for (var b in a)
                    if (a.hasOwnProperty(b)) return !1;
                return !0
            },
            removeAccent: function (a) {
                return "string" == typeof a ? a = a.toLowerCase().replace(new RegExp("[" + g.from + "]", "g"), function (a) {
                    return g.to[g.from.indexOf(a)]
                }) : void 0
            },
            slugify: function (a) {
                return a = this.removeAccent(a), a = a.replace(/[^-a-z0-9]+/g, "-").replace(/-+/g, "-").trim("-")
            },
            sort: function (a, b, c) {
                var d = function (b) {
                    for (var d = 0; d < a.length; d++)
                        if ("undefined" != typeof b[a[d]]) return c(b[a[d]])
                };
                return b = [-1, 1][+!!b],
                    function (a, c) {
                        return a = d(a), c = d(c), b * ((a > c) - (c > a))
                    }
            },
            replaceAt: function (a, b, c, d) {
                return a.substring(0, b) + d + a.substring(b + c)
            },
            highlight: function (a, b, c) {
                a = String(a);
                var d = a.toLowerCase().indexOf(b.toLowerCase());
                return c && (d = this.removeAccent(a).indexOf(this.removeAccent(b))), -1 === d || 0 === b.length ? a : this.replaceAt(a, d, b.length, "<strong>" + a.substr(d, b.length) + "</strong>")
            },
            joinObject: function (a, b) {
                var c = "",
                    d = 0;
                for (var e in a) a.hasOwnProperty(e) && (0 !== d && (c += b), c += a[e], d++);
                return c
            },
            removeDataAttributes: function (a) {
                var b, c = [],
                    d = a.get(0).attributes;
                for (b = 0; b < d.length; b++) "data-" === d[b].name.substring(0, 5) && c.push(d[b].name);
                for (b = 0; b < c.length; b++) a.removeAttr(c[b])
            },
            getCaret: function (a) {
                if (a.selectionStart) return a.selectionStart;
                if (b.selection) {
                    a.focus();
                    var c = b.selection.createRange();
                    if (null == c) return 0;
                    var d = a.createTextRange(),
                        e = d.duplicate();
                    return d.moveToBookmark(c.getBookmark()), e.setEndPoint("EndToStart", d), e.text.length
                }
                return 0
            },
            executeCallback: function (b, d) {
                if (!b) return !1;
                var e;
                d[0];
                if ("function" == typeof b) e = b;
                else if ("string" == typeof b || b instanceof Array) {
                    e = a, "string" == typeof b && (b = [b, []]);
                    for (var f = b[0].split("."), g = b[1], h = !0, i = 0; i < f.length;) {
                        if ("undefined" == typeof e) {
                            h = !1;
                            break
                        }
                        e = e[f[i++]]
                    }
                    if (!h || "function" != typeof e) return !1
                }
                return e.apply(this, c.merge(g || [], d ? d : [])) || !0
            },
            typeWatch: function () {
                var a = 0;
                return function (b, c) {
                    clearTimeout(a), a = setTimeout(b, c)
                }
            }()
        }
    }, c.fn.typeahead = c.typeahead = function (a) {
        return i.typeahead(this, a)
    };
    var i = {
        typeahead: function (b, d) {
            if (d && d.source && "object" == typeof d.source) {
                if ("function" == typeof b) {
                    if (!d.input) return;
                    b = c(d.input)
                }
                if (1 === b.length) return a.Typeahead[b.selector] = new h(b, d)
            }
        }
    };
    "trim" in String.prototype || (String.prototype.trim = function () {
        return this.replace(/^\s+/, "").replace(/\s+$/, "")
    }), "indexOf" in Array.prototype || (Array.prototype.indexOf = function (a, b) {
        b === d && (b = 0), 0 > b && (b += this.length), 0 > b && (b = 0);
        for (var c = this.length; c > b; b++)
            if (b in this && this[b] === a) return b;
        return -1
    })
}(window, document, window.jQuery);
