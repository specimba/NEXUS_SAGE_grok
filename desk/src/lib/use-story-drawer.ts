"use client";
/**
 * Beat 8 — keyboard-ready drawer state. Exposes open / close / next / prev so Beat 9 can bind
 * j/k/Enter/Esc; this hook adds NO global key handlers. Syncs `?story=<clusterId>` (replaceState)
 * and returns focus to the element that opened the drawer on close.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { readStoryParam, stepId, writeStoryParam } from "@/lib/story-drawer";

export type StoryDrawer = {
  openId: string | null;
  open: (id: string, opener?: HTMLElement | null) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
};

export function useStoryDrawer(ids: readonly string[]): StoryDrawer {
  const [openId, setOpenId] = useState<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const id = readStoryParam(window.location.search);
    if (id && ids.includes(id)) setOpenId(id);
    // mount only: a linked/reloaded ?story opens once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = useCallback((id: string | null) => {
    const { pathname, search, hash } = window.location;
    window.history.replaceState(window.history.state, "", `${pathname}${writeStoryParam(search, id)}${hash}`);
  }, []);

  const open = useCallback(
    (id: string, el?: HTMLElement | null) => {
      if (el) opener.current = el;
      setOpenId(id);
      sync(id);
    },
    [sync],
  );

  const current = useRef<string | null>(null);
  current.current = openId;

  const close = useCallback(() => {
    const id = current.current;
    setOpenId(null);
    sync(null);
    // Focus back to the row now showing in the drawer (next/prev may have moved it), else the opener.
    const row = id ? document.querySelector<HTMLElement>(`[data-story-row="${CSS.escape(id)}"]`) : null;
    const el = row ?? opener.current;
    opener.current = null;
    if (el) window.requestAnimationFrame(() => el.focus());
  }, [sync]);

  const step = useCallback(
    (dir: 1 | -1) => {
      setOpenId((cur) => {
        const n = stepId(ids, cur, dir);
        if (n) sync(n);
        return n;
      });
    },
    [ids, sync],
  );

  return { openId, open, close, next: () => step(1), prev: () => step(-1) };
}
