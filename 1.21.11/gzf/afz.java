import org.jspecify.annotations.Nullable;

public class afz implements aay<adb> {
   public static final aao<wx, afz> a = aay.a(afz::a, afz::new);
   private final int b;
   private final byte c;

   public afz(cgk $$0, byte $$1) {
      this.b = $$0.aA();
      this.c = $$1;
   }

   private afz(wx $$0) {
      this.b = $$0.l();
      this.c = $$0.readByte();
   }

   private void a(wx $$0) {
      $$0.c(this.b);
      $$0.l(this.c);
   }

   public aba<afz> a() {
      return ahz.av;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   @Nullable
   public cgk a(dwo $$0) {
      return $$0.a(this.b);
   }

   public float b() {
      return bgj.a(this.c);
   }
}
