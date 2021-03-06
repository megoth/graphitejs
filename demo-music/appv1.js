require([
    "js/graphite",
    "js/jquery",
    "js/tmpl"
], function (Graphite, $) {
    var base = "http://localhost:9090/";
    function appendBreadcrumb(graphite, label, options) {
        var item = $("#tmplBreadcrumbListItem").tmpl({
            Label: label
        });
        item.find("a").bind("click", function () {
            loadTracks(graphite, options);
            return false;
        });
        item.appendTo("#Breadcrumb");
    }
    function loadTracks (graphite, options) {
        options = options || {};
        $("#Breadcrumb").html("");
        $("#TrackList").html("");
        appendBreadcrumb(graphite, "All");
        graphite.query(base + "queries/tracks.rq");
        if (options.album) {
            appendBreadcrumb(graphite, "album: " + options.album, { album: options.album });
            graphite.regex("?album", options.album, "i");
        }
        if (options.albumUrl) {
            appendBreadcrumb(graphite, "album: " + options.albumName, {
                albumName: options.albumName,
                albumUrl: options.albumUrl
            });
            graphite.filter("?r = <{0}>", options.albumUrl);
        }
        if (options.artist) {
            appendBreadcrumb(graphite, "artist: " + options.artist, { artist: options.artist });
            graphite.regex("?artist", options.artist, "i");
        }
        if (options.artistUrl) {
            appendBreadcrumb(graphite, "artist: " + options.artistName, {
                artistName: options.artistName,
                artistUrl: options.artistUrl
            });
            graphite.filter("?a = <{0}>", options.artistUrl);
        }
        if (options.track) {
            appendBreadcrumb(graphite, "track: " + options.track, { track: options.track });
            graphite.regex("?track", options.track, "i");
        }
        if (options.userUrl) {
            appendBreadcrumb(graphite, "user: " + options.userName, {
                userName: options.userName,
                userUrl: options.userUrl
            });
            graphite
                .where("?user ma:listensTo ?t")
                .filter("?user = <{0}>", options.userUrl);
        }
        graphite.execute(function (artist, album, artistUrl, albumUrl, track, year, spotifyUrl) {
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
    function loadUsers (graphite) {
        graphite
            .query(base + "queries/users.rq")
            .execute(function (userUrl, name, gender) {
                $("#tmplUserListItem")
                    .tmpl({
                        "Gender": gender,
                        "Name": name,
                        "UserUrl": userUrl
                    })
                    .appendTo("#UserList");
            });
    }
    function readySearch(graphite) {
        $("#Search")
            .bind("submit", function () {
                var form = $(this),
                    options = {
                        album: form.find("input[name='album']").val(),
                        artist: form.find("input[name='artist']").val(),
                        track: form.find("input[name='track']").val()
                    };
                loadTracks(graphite, options);
                return false;
            })
            .find("input[type='reset']")
            .bind("click", function () {
                loadTracks(graphite);
            });
    }
    function readyTracks(graphite) {
        var tracks = $("#TrackList");
        tracks
            .find("a[data-artist]")
            .live("click", function () {
                var link = $(this),
                    url = link.data('artist'),
                    name = link.html();
                loadTracks(graphite, {
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
                loadTracks(graphite, {
                    albumUrl: url,
                    albumName: name
                });
                return false;
            });
    }
    function readyUsers(graphite) {
        var users = $("#UserList");
        users
            .find("a[data-user]")
            .live("click", function () {
                var link = $(this),
                    user = link.data("user"),
                    name = link.html();
                loadTracks(graphite, {
                    userName: name,
                    userUrl: user
                });
                return false;
            });
        users
            .find("a.all")
            .live("click", function() {
                loadTracks(graphite);
                return false;
            });
    }
    $(document).ready(function () {
        var g = Graphite()
            .load(base + "data/users.jsonld")
            .load(base + "data/artists.jsonld")
            .load(base + "data/records.ttl")
            .load(base + "data/tracks.ttl");
        loadUsers(g);
        loadTracks(g);
        readySearch(g);
        readyTracks(g);
        readyUsers(g);
    });
});