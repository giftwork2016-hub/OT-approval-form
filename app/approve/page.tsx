import ApproveClient from "./approve-client";

export default function ApprovePage({ searchParams }: { searchParams: { rid?: string; token?: string } }) {
  return <ApproveClient requestId={searchParams.rid} token={searchParams.token} />;
}
