require([
    "js/graphite/graph",
    "js/graphite/loader",
    "js/graphite/query",
    "js/jquery",
    "js/tmpl"
], function (Graph, Loader, Query, $) {
    var trackQuery,
        userQuery;
    function appendBreadcrumb(graph, label, options) {
        var item = $("#tmplBreadcrumbListItem").tmpl({
            Label: label
        });
        item.find("a").bind("click", function () {
            loadTracks(graph, options);
            return false;
        });
        item.appendTo("#Breadcrumb");
    }
    function loadTracks (graph, options) {
        options = options || {};
        $("#Breadcrumb").html("");
        $("#TrackList").html("");
        appendBreadcrumb(graph, "All");
        var query = Query(trackQuery);
        if (options.album) {
            appendBreadcrumb(graph, "album: " + options.album, { album: options.album });
            query.regex("?album", options.album, "i");
        }
        if (options.albumUrl) {
            appendBreadcrumb(graph, "album: " + options.albumName, {
                albumName: options.albumName,
                albumUrl: options.albumUrl
            });
            query.filter('?album = "{0}"', options.albumName);
        }
        if (options.artist) {
            appendBreadcrumb(graph, "artist: " + options.artist, { artist: options.artist });
            query.regex("?artist", options.artist, "i");
        }
        if (options.artistUrl) {
            appendBreadcrumb(graph, "artist: " + options.artistName, {
                artistName: options.artistName,
                artistUrl: options.artistUrl
            });
            query.filter("?a = <{0}>", options.artistUrl);
        }
        if (options.track) {
            appendBreadcrumb(graph, "track: " + options.track, { track: options.track });
            query.regex("?track", options.track, "i");
        }
        if (options.userUrl) {
            appendBreadcrumb(graph, "user: " + options.userName, {
                userName: options.userName,
                userUrl: options.userUrl
            });
            query
                .where("?user ma:listensTo ?t")
                .filter("?user = <{0}>", options.userUrl);
        }
        //console.log("IN APPv2", query);
        graph.execute(query, function (artist, album, artistUrl, albumUrl, track, year, spotifyUrl) {
            $("#tmplTrackListItem").tmpl({
                Album: album,
                AlbumUrl: albumUrl,
                Artist: artist,
                ArtistUrl: artistUrl,
                Spotify: spotifyUrl,
                Track: track,
                Year: year
            }).appendTo("#TrackList");
        });
    }
    function loadUsers (graph) {
        var query = Query(userQuery);
        graph.execute(query, function (userUrl, name, gender) {
                $("#tmplUserListItem")
                    .tmpl({
                        "Gender": gender,
                        "Name": name,
                        "UserUrl": userUrl
                    })
                    .appendTo("#UserList");
            });
    }
    function readySearch(graph) {
        $("#Search")
            .bind("submit", function () {
                var form = $(this),
                    options = {
                        album: form.find("input[name='album']").val(),
                        artist: form.find("input[name='artist']").val(),
                        track: form.find("input[name='track']").val()
                    };
                loadTracks(graph, options);
                return false;
            })
            .find("input[type='reset']")
            .bind("click", function () {
                loadTracks(graph);
            });
    }
    function readyTracks(graph) {
        var tracks = $("#TrackList");
        tracks
            .find("a[data-artist]")
            .live("click", function () {
                var link = $(this),
                    url = link.data('artist'),
                    name = link.html();
                loadTracks(graph, {
                    artistUrl: url,
                    artistName: name
                });
                return false;
            });
        tracks
            .find("a[data-album]")
            .live("click", function () {
                var link = $(this),
                    url = link.data('album'),
                    name = link.html();
                loadTracks(graph, {
                    albumUrl: url,
                    albumName: name
                });
                return false;
            });
    }
    function readyUsers(graph) {
        var users = $("#UserList");
        users
            .find("a[data-user]")
            .live("click", function () {
                var link = $(this),
                    userUrl = link.data("user"),
                    name = link.html();
                loadTracks(graph, {
                    userUrl: userUrl,
                    userName: name
                });
                return false;
            });
        users
            .find("a.all")
            .live("click", function() {
                loadTracks(graph);
                return false;
            });
    }
    $(document).ready(function () {
        var base = "http://localhost:9090/";
        var g = Graph([
            base + "data/users.jsonld",
            base + "data/artists.jsonld",
            base + "data/records.ttl",
            base + "data/tracks.ttl"
        ]);
        Loader({
            success: function (err, data) {
                trackQuery = data;
                Loader({
                    success: function (err, data) {
                        userQuery = data;
                        loadUsers(g);
                        loadTracks(g);
                        readySearch(g);
                        readyTracks(g);
                        readyUsers(g);
                    },
                    uri: base + "queries/users.rq"
                })
            },
            uri: base + "queries/tracks.rq"
        });
    });
});