'use strict';

/* Generate the feed content
 * Requires: recentMessages
 * Returns: the messages as JSON
 */
exports.generateFeed = function(recentMessages, callback) {
  var webremix = require('./web-remix');
  var newMessages = [];

  recentMessages.forEach(function(recent) {
    if (recent.text) {
      var messageData = {};

      webremix.generate(recent.text, function(errMsg, message) {
        if (!errMsg) {
          messageData = {
            id: recent.id,
            created_at: recent.created_at,
            message: message,
            user: recent.user.avatar_image.url,
            name: recent.user.name,
            user_id: recent.user.id
          };

          newMessages.push(messageData);

          if (newMessages.length === recentMessages.length - 1) {
            newMessages = newMessages.sort(function(a, b) {
              return parseInt(a.id, 10) - parseInt(b.id, 10);
            });

            callback(newMessages);
          }
        }
      });
    }
  });
};