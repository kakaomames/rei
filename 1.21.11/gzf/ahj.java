import org.jspecify.annotations.Nullable;

public class ahj implements aay<adb> {
   public static final aao<wx, ahj> a = aay.a(ahj::a, ahj::new);
   private static final int b = 1;
   private static final int c = 2;
   @Nullable
   private final amo d;
   @Nullable
   private final bdb e;

   public ahj(@Nullable amo $$0, @Nullable bdb $$1) {
      this.d = $$0;
      this.e = $$1;
   }

   private ahj(wx $$0) {
      int $$1 = $$0.readByte();
      if (($$1 & 1) > 0) {
         this.e = (bdb)$$0.b(bdb.class);
      } else {
         this.e = null;
      }

      if (($$1 & 2) > 0) {
         this.d = $$0.q();
      } else {
         this.d = null;
      }

   }

   private void a(wx $$0) {
      if (this.e != null) {
         if (this.d != null) {
            $$0.l(3);
            $$0.a((Enum)this.e);
            $$0.a(this.d);
         } else {
            $$0.l(1);
            $$0.a((Enum)this.e);
         }
      } else if (this.d != null) {
         $$0.l(2);
         $$0.a(this.d);
      } else {
         $$0.l(0);
      }

   }

   public aba<ahj> a() {
      return ahz.bd;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   @Nullable
   public amo b() {
      return this.d;
   }

   @Nullable
   public bdb e() {
      return this.e;
   }
}
