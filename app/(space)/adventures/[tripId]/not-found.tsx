import Link from "next/link";
export default function MissingTrip() {
  return <section className="space-y-4 p-6"><h1 className="text-2xl font-semibold">This adventure isn’t here.</h1><p className="text-sm">It may have been removed. Let’s return to our plans.</p><Link className="inline-flex min-h-11 items-center underline" href="/adventures">All our adventures</Link></section>;
}
