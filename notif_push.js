   
$(function() {
    
    if (navigator.cookieEnabled !== true) return;
    
    var config = {
        notif_comm: false,
        forum_name: "Forumul forumurilor",
        forum_icon: "https://redcdn.net/frmste/images/sigle.png",
        recheck: 120, 
        debug: false,
        lang: "ro", // "eng" or "ro"
        margin_top: 30,
        limit: 4,
        forums: [45, 43, 44]
    };
    
    config.forums = shuffle(config.forums);
 
    
    switch (config.lang) {
        case "ro":
            $lang = {
                request_permission : "%s doreste sa va afiseze notificari",
                allow : "Permite",
                notallow : "Nu, multumesc"
            };
        break;
        
        case "eng":
            $lang = {
                request_permission : "%s wants to show notifications",
                allow : "Allow",
                notallow : "No, thank you"
            };
        break;
    }    
    function sentNotif() {
        if (Notification.permission !== "granted") {
            if(getCookie("notif_allow") !== "") return;
            requestPermissions();
        } else if (navigator.cookieEnabled === true) {
            setCookie("notif_allow", true, 365);
            
            if (getCookie("notif_push_forum_" + config.forums[0]) !== "") {
                
                $posts = shuffle(JSON.parse(getCookie("notif_push_forum_" + config.forums[0])));
                if (getCookie("notif_push_topics").indexOf($posts[0].topic_id) > -1) return;
                
                if (getCookie("notif_count") >= config.limit) return;
                
                if (getCookie("notif_wait") === "1") return;
                
                setCookie("notif_wait", "1", "", 3);
                
                viewTopic($posts[0].topic_id);
                var notification = new Notification(config.forum_name, {
                    icon: config.forum_icon,
                    body: $posts[0].topic_title
                });
                notification.onclick = function() {
                    window.open($posts[0].topic_link);
                    window.focus();
                };
                
                notifCount();
            }
        }
    }
    
    function notifCount() {
        if(getCookie("notif_count") === "") {
            setCookie("notif_count", 1, 1);
        } else {
            setCookie("notif_count", (Number(getCookie("notif_count") ) + 1), 1);
        }
    }
    function viewTopic($topic_id) {
        if ($topic_id === null || $topic_id === "") return;
        $seen = [];
        if (getCookie("notif_push_topics") === "") {
            $seen = [$topic_id];
            setCookie("notif_push_topics", JSON.stringify($seen), 30);
            if (config.debug === true) {
                console.log("[DEBUG] The cookie \"notif_push_topics\" has been created");
                console.log($seen);
            }
        } else {
            if ($.inArray($topic_id, JSON.parse(getCookie("notif_push_topics"))) === -1) {
                setCookie("notif_push_topics", JSON.stringify(JSON.parse(getCookie("notif_push_topics")).concat($topic_id)), 30);
                if (config.debug === true) {
                    console.log("[DEBUG] The cookie \"notif_push_topics\" has been updated");
                    console.log(JSON.parse(getCookie("notif_push_topics")));
                }
            } else {
                if (config.debug === true) {
                    console.log("[DEBUG] The cookie \"notif_push_topics\" is already the value " + $topic_id);
                    console.log(JSON.parse(getCookie("notif_push_topics")));
                }
            }
        }
    }
    function requestPermissions() {
        
        if (getCookie("notif_allow") === "false") return;
        
        $("head").append('<style>.mondal_notif{position:fixed;top:' + config.margin_top + 'px;margin:0 auto;width:100%;}.mondal_notif > .container_notif{width:600px;background:#fff;box-shadow:0 0 20px rgba(0,0,0,0.3);padding:10px;text-align:center;margin:0 auto;border:1px solid #d7d7d7;margin-top:-1px}.mondal_notif > .container_notif p{font-size:16px}.mondal_notif [name="allow"],.mondal_notif [name="notallow"]{background:#39c;padding:10px;cursor:pointer;margin-right:20px;border:0;color:#fff;font-weight:400;text-transform:uppercase}.mondal_notif [name="notallow"]{background:#adadad}</style');
        
        $("body").append('  <div class="mondal_notif">' + 
                                '<div class="container_notif">' +
                                    '<p>' + $lang.request_permission.replace("%s", config.forum_name) + '</p>' +
                                    '<div class="buttons_notif">' +
                                        '<button name="allow" class="allownotif">' + $lang.allow + '</button>' +
                                        '<button name="notallow"  class="notallownotif">' + $lang.notallow + '</button>' +
                                    '</div>' +
                                '</div>' +
                            '</div>');
                            
        $('.allownotif').on( "click", function() {
            setCookie("notif_allow", true, 7);
            Notification.requestPermission();
            $(".mondal_notif").hide();
        });
    
        $('.notallownotif').on( "click", function() {
            setCookie("notif_allow", false, 7);
            $(".mondal_notif").hide();
        });                       
                            
    }
    function reloadData() {
        for (var x = 0; x < config.forums.length; x++) {
            $id = config.forums[x];
            $.get("/feed/?f=" + $id).done(function(data) {
                $id = config.forums[x];
                $object = [];
                $xml = $(data);
                if (getCookie("notif_push_topics") === "" || getCookie("notif_push_topics") === null) {
                    setCookie("notif_push_topics", JSON.stringify([]), 30);
                }
                for (var i = 0; i < $xml.find("item").length; i++) {
                    if (checkDate(new Date(new Date().getTime() + -1 * 24 * 60 * 60 * 1000), $xml.find("item").find("pubDate")[i].textContent, $xml.find("item").find("pubDate")[i].textContent) && JSON.parse(getCookie("notif_push_topics")).indexOf($xml.find("item").find("link")[i].textContent.replace(/[^0-9]+/g, "")) === -1) {
                        $object.push({
                            topic_id: $xml.find("item").find("link")[i].textContent.replace(/[^0-9]+/g, ""),
                            topic_title: $xml.find("item").find("title")[i].textContent,
                            topic_date: $xml.find("item").find("pubDate")[i].textContent,
                            topic_link: $xml.find("item").find("link")[i].textContent,
                            forum_id: $xml.find("image").find("link").text().replace(/[^0-9]+/g, ""),
                            comment_id: $xml.find("item").find("comments")[i].textContent.replace(/[^0-9]+/g, ""),
                            forum_name: $xml.find("image").find("title").text()
                        });
                    }
                }
                if (!isEmpty($object)) {
                    $cookie_name = "notif_push_forum_" + $xml.find("image").find("link").text().replace(/[^0-9]+/g, "");
                    if (getCookie($cookie_name) === "" || getCookie($cookie_name) !== JSON.stringify($object)) {
                        if (config.debug === true) {
                            console.log("[DEBUG] The cookie \"" + $cookie_name + "\" has been saved/updated");
                            console.log($object);
                        }
                        setCookie($cookie_name, JSON.stringify($object), 30);
                    }
                }
            });
        }
    }
    function shuffle(array) {
        var currentIndex = array.length,
            temporaryValue, randomIndex;
        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }
    function checkDate(from, to, check) {
        var fDate = Date.parse(from),
            lDate = Date.parse(to),
            cDate = Date.parse(check);
        if ((cDate <= lDate && cDate >= fDate)) {
            return true;
        }
        return false;
    }
    function isEmpty(obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key))
                return false;
        }
        return true;
    }
    function setCookie(cname, cvalue, exdays, exmins) {
        var d = new Date();
        if(exdays === "") {
            d.setTime(d.getTime() + (exmins * 60 * 1000));
        } else {
            d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        }
        var expires = "expires=" + d.toGMTString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    function getCookie(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
    setTimeout(function() {
        reloadData();
        sentNotif();
    }, (config.recheck * 1000));
    window.onload = function() {
        reloadData();
        sentNotif();
    };
});
