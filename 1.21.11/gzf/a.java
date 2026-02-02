import org.joml.Quaternionf;
import org.joml.Vector3f;

@FunctionalInterface
public interface a {
   a a = ($$0) -> {
      return (new Quaternionf()).rotationX(-$$0);
   };
   a b = ($$0) -> {
      return (new Quaternionf()).rotationX($$0);
   };
   a c = ($$0) -> {
      return (new Quaternionf()).rotationY(-$$0);
   };
   a d = ($$0) -> {
      return (new Quaternionf()).rotationY($$0);
   };
   a e = ($$0) -> {
      return (new Quaternionf()).rotationZ(-$$0);
   };
   a f = ($$0) -> {
      return (new Quaternionf()).rotationZ($$0);
   };

   static a of(Vector3f $$0) {
      return ($$1) -> {
         return (new Quaternionf()).rotationAxis($$1, $$0);
      };
   }

   Quaternionf rotation(float var1);

   default Quaternionf rotationDegrees(float $$0) {
      return this.rotation($$0 * 0.017453292F);
   }
}
