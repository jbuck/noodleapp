'use strict';

define(['jquery'], function ($) {
  var messages = $('ol.messages');
  var currentFeed = '/my/feed';
  var myFeed = $('.my-feed');
  var overlay = $('#overlay');
  var userId = $('.action-buttons').data('userid');
  var sinceId = null;
  var isFragment = false;

  var MESSAGE_LIMIT = 19;
  var POLL_TIMEOUT = 60000;

  // Wait 1 minute to get new data
  var pollMessages = function() {
    setTimeout(function() {
      setMessage(currentFeed, type);
    }, POLL_TIMEOUT);
  };

  var dateDisplay = function(time) {
    var date = new Date(time);
    var diff = (Date.now() - date) / 1000;
    var dayDiff = Math.floor(diff / 86400);

    if (isNaN(dayDiff) || dayDiff < 0) {
      return '?';
    }

    if (dayDiff === 0) {
      if (diff < 60) {
        return '< 1m';
      } else if (diff < 3600) {
        return Math.floor(diff / 60) + 'm';
      } else {
        return Math.floor(diff / 3600) + 'h';
      }
    } else {
      return dayDiff + 'd';
    }
  };

  var setFollow = function(url, userId) {
    overlay.html('<img src="/images/ajax-loader.gif" class="loading">');
    overlay.slideDown();
    $.ajax({
      url: url,
      type: 'GET',
      data: { user_id: userId },
      dataType: 'json',
      cache: false

    }).done(function(data) {
      var userList = $('<ol class="users"></ol>');
      for (var i = 0; i < data.users.length; i ++) {
        var user = $('<li><a href=""><img src=""><span class="name"></span></a></li>');
        user.find('img').attr('src', data.users[i].avatar_image.url);
        user.find('a')
          .attr('href', '/user/' + data.users[i].username)
          .find('span.name').html(data.users[i].name + ' <em>@' + data.users[i].username + '</em>');
        userList.prepend(user);
      }
      userList.append('<li class="close">Close</li>');
      overlay.html(userList);
    });
  };

  var setPost = function(postId, url, showDetails) {
    overlay.html('<img src="/images/ajax-loader.gif" class="loading">');
    overlay.slideDown();
    $.ajax({
      url: url,
      type: 'GET',
      data: { post_id: postId },
      dataType: 'json',
      cache: false

    }).done(function(data) {
      var messageOverlay = $('<ol class="message-summary"></ol>');

      if (data.messages.length > 0) {
        for (var i = 0; i < data.messages.length; i ++) {
          var detailExtras = '';

          if (showDetails) {
            detailExtras = '<div class="info"><ol>' +
              '<li class="reposts">Reposts: <span></span></li>' +
              '<li class="stars">Stars: <span></span></li></ol></div>';
          }

          var message = $('<li class="message-item" data-id="' +
            data.messages[i].id + '" ' + 'data-username="' + data.messages[i].username + '">' +
            '<div class="meta"><a href="" class="who" title=""><img src=""></a>' +
            '<div class="details"><a href="" class="username"></a><time></time>' +
            '</ol></div></div><p></p>' + detailExtras + '</li>');
          // user's profile page
          message.find('a.who')
            .attr('title', data.messages[i].name)
            .attr('href', '/user/' + data.messages[i].username);
          // user's full name
          message.find('a.username')
            .attr('href', '/user/' + data.messages[i].username)
            .text(data.messages[i].name);
          // time
          message.find('time').text(dateDisplay(data.messages[i].created_at));
          // user's avatar
          message.find('a.who img').attr('src', data.messages[i].user);
          // user's message
          message.find('p').html(data.messages[i].message);

          if (showDetails) {
            message.find('.info .reposts span').text(data.messages[i].numReposts);
            message.find('.info .stars span').text(data.messages[i].numStars);
          }

          messageOverlay.append(message);
        }
      }

      messageOverlay.append('<li class="close">Close</li>');
      overlay.html(messageOverlay);
      overlay.slideDown();
    });
  };

  var setMessage = function(url, type) {
    currentFeed = url;

    if (!isFragment) {
      messages.html('<li class="loading"><img src="/images/ajax-loader.gif"></li>');
    }
    $.ajax({
      url: url,
      type: type,
      data: { since_id: sinceId },
      dataType: 'json',
      cache: false

    }).done(function(data) {
      // This refreshes the feed entirely but we can figure out ways to make it less
      // intrusive.
      if (!isFragment) {
        messages.empty();
      }

      if (data.messages.length > 0) {
        for (var i = 0; i < data.messages.length; i ++) {
          var isRepost = '';
          var threadAction = '';
          var isStarred = '<li class="star"></li>';

          if (!data.messages[i].isSelf) {
            isRepost = '<li class="repost"></li>';

            if (data.messages[i].isRepost) {
              isRepost = '<li class="repost on"></li>';
            }
          }

          if (data.messages[i].isThread) {
            threadAction = '<li class="thread"></li>';
          }

          if (data.messages[i].isStarred) {
            isStarred = '<li class="star on"></li>';
          }

          var message = $('<li class="message-item" data-id="' +
            data.messages[i].id + '" ' + 'data-username="' + data.messages[i].username + '">' +
            '<div class="meta"><a href="" class="who" title=""><img src=""></a>' +
            '<div class="details"><a href="" class="username"></a><time></time><ol class="actions">' +
            threadAction + isStarred + '<li class="reply"></li>' + isRepost +
            '</ol></div></div><p></p></li>');
          // user's profile page
          message.find('a.who')
            .attr('title', data.messages[i].name)
            .attr('href', '/user/' + data.messages[i].username);
          // user's full name
          message.find('a.username')
            .attr('href', '/user/' + data.messages[i].username)
            .text(data.messages[i].name);
          // time
          message.find('time').text(dateDisplay(data.messages[i].created_at));
          // user's avatar
          message.find('a.who img').attr('src', data.messages[i].user);
          // user's message
          message.find('p').html(data.messages[i].message);

          messages.prepend(message);
        }

        messages.find('> li:gt(' + MESSAGE_LIMIT + ')').remove();
        sinceId = data.messages[data.messages.length - 1].id;
      }

      if (!isFragment) {
        clearTimeout(pollMessages);
      }

      isFragment = true;

      pollMessages = setTimeout(function() {
        setMessage(currentFeed, type);
      }, POLL_TIMEOUT);
    });
  };

  var self = {
    getMyFeed: function() {
      isFragment = false;
      sinceId = null;
      setMessage('/my/feed', 'GET');
    },

    getUserPosts: function() {
      isFragment = false;
      sinceId = null;
      setMessage('/user/posts/' + messages.data('userid'), 'GET');
    },

    getUserMentions: function() {
      isFragment = false;
      sinceId = null;
      setMessage('/user/mentions/' + messages.data('userid'), 'GET');
    },

    getUserStarred: function() {
      isFragment = false;
      sinceId = null;
      setMessage('/user/starred/' + messages.data('userid'), 'GET');
    },

    getGlobalFeed: function() {
      isFragment = false;
      sinceId = null;
      setMessage('/global/feed', 'GET');
    },

    starMessage: function(id, csrf) {
      isFragment = true;
      $.ajax({
        url: '/star',
        type: 'POST',
        data: { post_id: id, _csrf: csrf },
        dataType: 'json',
        cache: false
      });
    },

    unstarMessage: function(id, csrf) {
      isFragment = true;
      $.ajax({
        url: '/star',
        type: 'DELETE',
        data: { post_id: id, _csrf: csrf },
        dataType: 'json',
        cache: false
      });
    },

    repostMessage: function(id, csrf) {
      isFragment = true;
      $.ajax({
        url: '/repost',
        type: 'POST',
        data: { post_id: id, _csrf: csrf },
        dataType: 'json',
        cache: false
      });
    },

    unrepostMessage: function(id, csrf) {
      isFragment = true;
      $.ajax({
        url: '/repost',
        type: 'DELETE',
        data: { post_id: id, _csrf: csrf },
        dataType: 'json',
        cache: false
      });
    },

    follow: function(id, csrf) {
      isFragment = true;
      $.ajax({
        url: '/follow',
        type: 'POST',
        data: { user_id: id, _csrf: csrf },
        dataType: 'json',
        cache: false
      });
    },

    unfollow: function(id, csrf) {
      isFragment = true;
      $.ajax({
        url: '/follow',
        type: 'DELETE',
        data: { user_id: id, _csrf: csrf },
        dataType: 'json',
        cache: false
      });
    },

    mute: function(id, csrf) {
      isFragment = true;
      $.ajax({
        url: '/mute',
        type: 'POST',
        data: { user_id: id, _csrf: csrf },
        dataType: 'json',
        cache: false
      });
    },

    unmute: function(id, csrf) {
      isFragment = true;
      $.ajax({
        url: '/mute',
        type: 'DELETE',
        data: { user_id: id, _csrf: csrf },
        dataType: 'json',
        cache: false
      });
    },

    postMessage: function(form) {
      isFragment = true;
      $.ajax({
        url: '/add',
        type: 'POST',
        data: form.serialize(),
        dataType: 'json',
        cache: false

      }).done(function(data) {
        sinceId = null;
        myFeed.click();
      });
    },

    showFollowers: function() {
      setFollow('/followers', userId);
    },

    showFollowing: function() {
      setFollow('/following', userId);
    },

    showThread: function(postId) {
      setPost(postId, '/thread', false);
    },

    showPost: function(postId) {
      setPost(postId, '/post', true);
    }
  };

  return self;
});
