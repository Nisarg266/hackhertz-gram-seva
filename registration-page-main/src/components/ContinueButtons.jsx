import { Button } from "./Button";

export function ContinueButtons() {
  return (
    <div className="flex flex-col gap-y-4">
      <Button href="https://www.google.com" target="_blank" variant="secondary">
        <img src="https://www.svgrepo.com/show/452216/google.svg" alt="Google svg" className="pointer-events-none size-5" />
        <span className="text-sm/6 font-semibold">Google</span>
      </Button>
    </div>
  );
}
