import { RingLoader } from "react-spinners";

function Loading() {
  return (
    <div className="flex justify-center items-center h-screen w-full bg-gray-900">
      <RingLoader color="#FACC15" size={50} />
    </div>
  );
}

export default Loading;
