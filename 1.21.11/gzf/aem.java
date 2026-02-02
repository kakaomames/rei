import it.unimi.dsi.fastutil.ints.Int2ObjectMap;
import it.unimi.dsi.fastutil.ints.Int2ObjectOpenHashMap;

public class aem implements aay<adb> {
   public static final aao<wx, aem> a = aay.a(aem::a, aem::new);
   public static final aem.a b = new aem.a(0);
   public static final aem.a c = new aem.a(1);
   public static final aem.a d = new aem.a(2);
   public static final aem.a e = new aem.a(3);
   public static final aem.a f = new aem.a(4);
   public static final aem.a g = new aem.a(5);
   public static final aem.a h = new aem.a(6);
   public static final aem.a i = new aem.a(7);
   public static final aem.a j = new aem.a(8);
   public static final aem.a k = new aem.a(9);
   public static final aem.a l = new aem.a(10);
   public static final aem.a m = new aem.a(11);
   public static final aem.a n = new aem.a(12);
   public static final aem.a o = new aem.a(13);
   public static final int p = 0;
   public static final int q = 101;
   public static final int r = 102;
   public static final int s = 103;
   public static final int t = 104;
   private final aem.a u;
   private final float v;

   public aem(aem.a $$0, float $$1) {
      this.u = $$0;
      this.v = $$1;
   }

   private aem(wx $$0) {
      this.u = (aem.a)aem.a.a.get($$0.readUnsignedByte());
      this.v = $$0.readFloat();
   }

   private void a(wx $$0) {
      $$0.l(this.u.b);
      $$0.a(this.v);
   }

   public aba<aem> a() {
      return ahz.K;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public aem.a b() {
      return this.u;
   }

   public float e() {
      return this.v;
   }

   public static class a {
      static final Int2ObjectMap<aem.a> a = new Int2ObjectOpenHashMap();
      final int b;

      public a(int $$0) {
         this.b = $$0;
         a.put($$0, this);
      }
   }
}
