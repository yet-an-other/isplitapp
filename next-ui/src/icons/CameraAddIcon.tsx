import { SvgPathWrapper } from './SvgPathWrapper';

// Camera outline with plus badge (Flowbite style adaptation)
export function CameraAddIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <SvgPathWrapper iconProps={props}>
        <path strokeLinejoin="round" d="M4 18V8a1 1 0 0 1 1-1h1.5l1.707-1.707A1 1 0 0 1 8.914 5h6.172a1 1 0 0 1 .707.293L17.5 7H19a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/>
        <path strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
    </SvgPathWrapper>
  );
}

export default CameraAddIcon;

