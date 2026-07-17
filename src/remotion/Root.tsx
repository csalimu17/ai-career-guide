import { Composition, Folder } from "remotion";
import {
  AppActionVideo,
  DesktopAppDemo,
  MobileAppDemo,
  FPS,
  MAIN_DURATION_IN_FRAMES,
  SEGMENT_DURATION_IN_FRAMES,
} from "./app-action-video";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AppActionVideo"
        component={AppActionVideo}
        durationInFrames={MAIN_DURATION_IN_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />

      <Folder name="Device-Demos">
        <Composition
          id="DesktopAppDemo"
          component={DesktopAppDemo}
          durationInFrames={SEGMENT_DURATION_IN_FRAMES}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="MobileAppDemo"
          component={MobileAppDemo}
          durationInFrames={SEGMENT_DURATION_IN_FRAMES}
          fps={FPS}
          width={1080}
          height={1920}
        />
      </Folder>
    </>
  );
};
