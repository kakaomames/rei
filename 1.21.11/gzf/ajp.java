import org.jspecify.annotations.Nullable;

public class ajp implements aay<aib> {
   public static final aao<wx, ajp> a = aay.a(ajp::a, ajp::new);
   private final ajp.a b;
   @Nullable
   private final amo c;

   public ajp(ajp.a $$0, @Nullable amo $$1) {
      this.b = $$0;
      this.c = $$1;
   }

   public static ajp a(ac $$0) {
      return new ajp(ajp.a.a, $$0.a());
   }

   public static ajp b() {
      return new ajp(ajp.a.b, (amo)null);
   }

   private ajp(wx $$0) {
      this.b = (ajp.a)$$0.b(ajp.a.class);
      if (this.b == ajp.a.a) {
         this.c = $$0.q();
      } else {
         this.c = null;
      }

   }

   private void a(wx $$0) {
      $$0.a((Enum)this.b);
      if (this.b == ajp.a.a) {
         $$0.a(this.c);
      }

   }

   public aba<ajp> a() {
      return ahz.cg;
   }

   public void a(aib $$0) {
      $$0.a(this);
   }

   public ajp.a e() {
      return this.b;
   }

   @Nullable
   public amo f() {
      return this.c;
   }

   public static enum a {
      a,
      b;

      // $FF: synthetic method
      private static ajp.a[] a() {
         return new ajp.a[]{a, b};
      }
   }
}
