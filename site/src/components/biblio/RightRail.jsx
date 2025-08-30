import ImportMergePanel from './ImportMergePanel.jsx';
import ConceptTagsPanel from './ConceptTagsPanel.jsx';
import ReaderNotesPanel from './ReaderNotesPanel.jsx';
import WikiBlockPanel from './WikiBlockPanel.jsx';

export default function RightRail(){
  return (
    <aside className="biblio-right">
      <ImportMergePanel />
      <ConceptTagsPanel />
      <ReaderNotesPanel />
      <WikiBlockPanel />
    </aside>
  );
}
