import $ from "jquery";
import moment from "moment";
import { getInfo } from "../../../../services/api";
import { getComments, removeComment, addComment } from "./util";

export default function Comments(eventBus, overlays, bpmnjs) {
  function toggleCollapse(element) {
    let o = overlays.get({ element: element, type: "comments" })[0];
    let $overlay = o && o.html;
    if ($overlay) {
      let expanded = $overlay.is(".expanded");
      eventBus.fire("comments.toggle", { element: element, active: !expanded });
      if (expanded) {
        $overlay.removeClass("expanded");
      } else {
        $overlay.addClass("expanded");
        $overlay.find("textarea").focus();
      }
    }
  }

  function createCommentBox(element) {
    let $overlay = $(Comments.OVERLAY_HTML);
    $overlay.find(".toggle").click(function (e) {
      toggleCollapse(element);
    });

    let $commentCount = $overlay.find("[data-comment-count]"),
      $textarea = $overlay.find("textarea"),
      $comments = $overlay.find(".comments");

    function renderComments() {
      // clear innerHTML
      $comments.html("");
      let comments = getComments(element);
      comments.forEach(function (val) {
        let $comment = $(Comments.COMMENT_HTML);
        $comment.find("[data-text]").text(val[1]);
        $comment.find("[data-head]").text(val[0]);
        $comment.find("[data-delete]").click(function (e) {
          e.preventDefault();

          removeComment(element, val);
          renderComments();
          $textarea.val("");
        });

        $comments.append($comment);
      });
      $overlay[comments.length ? "addClass" : "removeClass"]("with-comments");
      $commentCount.text(comments.length ? "(" + comments.length + ")" : "");
      eventBus.fire("comments.updated", { comments: comments });
    }

    $textarea.on("keydown", async function (e) {
      if (e.which === 13 && !e.shiftKey) {
        const info = await getInfo();
        const username = (info && info["user.name"]) || "";
        e.preventDefault();
        let comment = $textarea.val();
        if (comment) {
          addComment(
            element,
            `${username}\t${moment().format("DD/MM/YYYY HH.mm")}\n`,
            comment
          );
          $textarea.val("");
          renderComments();
        }
      }
    });

    // attach an overlay to a node
    overlays.add(element, "comments", {
      position: {
        bottom: 20,
        right: 20,
      },
      html: $overlay,
    });

    renderComments();
  }

  eventBus.on("shape.added", function (event) {
    let element = event.element;

    if (
      element.labelTarget ||
      !element.businessObject.$instanceOf("bpmn:FlowNode")
    ) {
      return;
    }

    defer(function () {
      createCommentBox(element);
    });
  });

  this.collapseAll = function () {
    overlays.get({ type: "comments" }).forEach(function (c) {
      let html = c.html;
      if (html.is(".expanded")) {
        toggleCollapse(c.element);
      }
    });
  };
}

Comments.$inject = ["eventBus", "overlays", "bpmnjs"];

Comments.OVERLAY_HTML =
  '<div class="comments-overlay">' +
  '<div class="toggle">' +
  '<span class="icon-comment"></span>' +
  '<span class="comment-count" data-comment-count></span>' +
  "</div>" +
  '<div class="content">' +
  '<div class="comments"></div>' +
  '<div class="edit">' +
  '<textarea tabindex="1" placeholder="Add a comment"></textarea>' +
  "</div>" +
  "</div>" +
  "</div>";

Comments.COMMENT_HTML =
  '<div class="comment">' +
  '<div><b data-head></b></div><div data-text></div><a href class="delete icon-delete" data-delete></a>' +
  "</div>";

// helpers ///////////////

function defer(fn) {
  setTimeout(fn, 0);
}
