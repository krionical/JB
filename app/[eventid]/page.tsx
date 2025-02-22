"use client";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { Event } from "nostr-tools";
import { nip19 } from "nostr-tools";
import { RelayContext } from "../context/relay-context";
import { CachedEventContext } from "../context/cached-event-context";
import { ProfilesContext } from "../context/profiles-context";
import Blog from "./Blog";

const BlogPage = () => {
  const pathname = usePathname();
  let naddrStr: string = "";
  if (pathname && pathname.length > 60) {
    naddrStr = pathname.split("/").pop() || "";
  }

  const { relayUrl, subscribe } = useContext(RelayContext);
  const [event, setEvent] = useState<Event>();
  // @ts-ignore
  const { addProfiles } = useContext(ProfilesContext);
  const naddr: any = nip19.decode(naddrStr).data;

  // @ts-ignore
  const { cachedEvent, setCachedEvent } = useContext(CachedEventContext);

  const getEvents = async () => {
    let pubkeysSet = new Set<string>();

    setEvent(undefined);
    let relayName = relayUrl.replace("wss://", "");

    const filter = {
      kinds: [naddr.kind],
      authors: [naddr.pubkey],
      "#d": naddr.identifier,
    };

    let events: Event[] = [];

    const onEvent = (event: any) => {
      // @ts-ignore
      event.relayName = relayName;
      events.push(event);
      pubkeysSet.add(event.pubkey);
    };

    const onEOSE = () => {
      if (events.length > 0) {
        setEvent(events[0]);
      }
      if (pubkeysSet.size > 0) {
        addProfiles(Array.from(pubkeysSet));
      }
    };

    subscribe([naddr.relays[0]], filter, onEvent, onEOSE);
  };

  // todo cache
  useEffect(() => {
    if (cachedEvent) {
      // console.log("Using cached event", cachedEvent);
      setEvent(cachedEvent);
      setCachedEvent(undefined);
      return;
    }
    getEvents();
    // eslint-disable-next-line
  }, []);

  if (event) {
    return <Blog event={event} naddr={naddrStr} />;
  }
};

export default BlogPage;
