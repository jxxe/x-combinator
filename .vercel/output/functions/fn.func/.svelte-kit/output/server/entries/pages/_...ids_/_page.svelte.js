import { c as create_ssr_component, e as escape, d as add_classes, f as add_attribute, v as validate_component, h as each } from "../../../chunks/index2.js";
import ago from "s-ago";
const Column = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { index } = $$props;
  if ($$props.index === void 0 && $$bindings.index && index !== void 0)
    $$bindings.index(index);
  return `<div class="${[
    "shrink-0 w-[400px] max-w-[90vw] overflow-y-scroll overflow-x-hidden scrollbar-none",
    (index % 2 === 0 ? "bg-blue-50" : "") + " " + (index % 2 === 1 ? "bg-white" : "")
  ].join(" ").trim()}">${slots.default ? slots.default({}) : ``}</div>`;
});
const CommentItem = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { comment } = $$props;
  if ($$props.comment === void 0 && $$bindings.comment && comment !== void 0)
    $$bindings.comment(comment);
  return `<div class="space-y-1"><div class="text-xs flex justify-between"><div class="text-gray-500"><span>${escape(comment.by)}</span>
            <span>${escape(ago(new Date(comment.time * 1e3)))}</span></div>
        
        <p${add_classes((comment.kids?.length ? "text-blue-500" : "").trim())}>${escape(comment.kids?.length ?? 0)} ${escape((comment.kids?.length ?? 0) === 1 ? "reply" : "replies")}</p></div>

    <p class="prose"><!-- HTML_TAG_START -->${comment.text}<!-- HTML_TAG_END --></p></div>`;
});
const Header = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<div class="bg-blue-500 p-1 text-white flex gap-4 items-center justify-between leading-none sticky top-0 z-10"><a href="/" class="flex gap-2 items-center"><img class="w-5 h-5 border border-white" src="/assets/icon.svg" alt="">
        <p class="font-bold">Horizontal News</p></a>

    <a class="hover:underline" href="https://github.com/jxxe/x-combinator" target="_blank">GitHub</a></div>`;
});
const StoryItem = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { story } = $$props;
  let { selected = false } = $$props;
  if ($$props.story === void 0 && $$bindings.story && story !== void 0)
    $$bindings.story(story);
  if ($$props.selected === void 0 && $$bindings.selected && selected !== void 0)
    $$bindings.selected(selected);
  return `<div><h2${add_attribute("title", story.title, 0)}${add_attribute("class", selected ? "text-blue-500" : "", 0)}>${escape(story.title)}</h2>

    <div class="text-xs text-gray-500 flex gap-2.5"><span>${escape(story.score)} points</span>
        <span>${escape(ago(new Date(story.time * 1e3)))}</span>
        <span>${escape(story.descendants)} comments</span></div></div>`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  let topStories = [];
  let commentColumns = [];
  let selectedItems = [];
  let commentsContainer;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  return `
<div class="flex h-[100dvh] overflow-y-hidden scrollbar-none"${add_attribute("this", commentsContainer, 0)}>${validate_component(Column, "Column").$$render($$result, { index: 0 }, {}, {
    default: () => {
      return `${validate_component(Header, "Header").$$render($$result, {}, {}, {})}

        <div class="space-y-2 p-2">${topStories.length ? each(topStories, (story) => {
        return `<div class="cursor-pointer active:opacity-50 sm:active:!opacity-100">${validate_component(StoryItem, "StoryItem").$$render(
          $$result,
          {
            story,
            selected: selectedItems[0]?.id === story.id
          },
          {},
          {}
        )}
                </div>`;
      }) : `<p class="italic text-gray-500">Loading top stories...</p>`}</div>`;
    }
  })}

    ${selectedItems[0]?.type === "story" && selectedItems[0].url ? `${validate_component(Column, "Column").$$render($$result, { index: -1 }, {}, {
    default: () => {
      return `<iframe${add_attribute("src", `/embed-proxy?url=${encodeURIComponent(selectedItems[0].url)}`, 0)} frameborder="0"${add_attribute("title", selectedItems[0].title, 0)} class="w-full h-full [zoom:80%]"></iframe>`;
    }
  })}` : ``}

    ${each(commentColumns, (comments, columnIndex) => {
    return `${validate_component(Column, "Column").$$render($$result, { index: columnIndex + 1 }, {}, {
      default: () => {
        return `<div class="divide-y divide-gray-300">${each(comments, (comment, commentIndex) => {
          return `<div class="${"p-4 border-r-2 " + escape(
            selectedItems.some((item) => item.id === comment.id) ? "!border-r-blue-500" : "!border-r-transparent",
            true
          ) + " " + escape(comment.kids && "cursor-pointer active:opacity-50 sm:active:!opacity-100", true)}">${validate_component(CommentItem, "CommentItem").$$render($$result, { comment }, {}, {})}
                    </div>`;
        })}</div>
        `;
      }
    })}`;
  })}</div>`;
});
export {
  Page as default
};
